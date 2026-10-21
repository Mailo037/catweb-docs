/**
 * CatWeb block palette: categories, colours and insertable templates.
 *
 * Every template `text` is copied from the authoritative tables in game/JSONScript.md §7,
 * so blocks added in the Script Workspace have the exact slot shapes CatWeb expects.
 */

export const CATEGORIES = {
  event:     { name: 'Events',            color: '#d97706' },
  console:   { name: 'Console',           color: '#64748b' },
  logic:     { name: 'Logic',             color: '#ca8a04' },
  loops:     { name: 'Loops',             color: '#0891b2' },
  looks:     { name: 'Looks',             color: '#7c3aed' },
  hierarchy: { name: 'Hierarchy',         color: '#9333ea' },
  navigation:{ name: 'Navigation',        color: '#0d9488' },
  variables: { name: 'Math & Variables',  color: '#ea580c' },
  audio:     { name: 'Audio',             color: '#db2777' },
  input:     { name: 'Input',             color: '#4f46e5' },
  network:   { name: 'Network',           color: '#0284c7' },
  cookies:   { name: 'Cookies',           color: '#a16207' },
  color:     { name: 'Color',             color: '#be123c' },
  strings:   { name: 'Strings',           color: '#059669' },
  tables:    { name: 'Tables',            color: '#b45309' },
  functions: { name: 'Functions',         color: '#2563eb' },
  control:   { name: 'Control',           color: '#475569' }
};

const S = (value, l) => (l ? { value, t: 'string', l } : { value, t: 'string' });
const N = (value, l) => (l ? { value, t: 'number', l } : { value, t: 'number' });
const OBJ = (value, l) => (l ? { value, t: 'object', l } : { value, t: 'object' });
const ANY = (value) => ({ value, t: 'string', l: 'any' });
const BARE_ANY = (value) => ({ value, t: 'any' });
const VAR = (value = '1') => S(value, 'variable');

/** Event (hat) blocks, keyed by event id. */
export const EVENT_TEMPLATES = [
  { id: '0', cat: 'event', text: ['When website loaded...'] },
  { id: '1', cat: 'event', text: ['When', OBJ('', 'button'), 'pressed...'] },
  { id: '13', cat: 'event', text: ['When', OBJ('', 'button'), 'right clicked...'] },
  { id: '11', cat: 'event', text: ['When mouse down on', OBJ('', 'button'), '...'] },
  { id: '12', cat: 'event', text: ['When mouse up on', OBJ('', 'button'), '...'] },
  { id: '3', cat: 'event', text: ['When mouse enters', OBJ(''), '...'] },
  { id: '5', cat: 'event', text: ['When mouse leaves', OBJ(''), '...'] },
  { id: '2', cat: 'event', text: ['When', { value: 'E', t: 'key' }, 'pressed...'] },
  { id: '16', cat: 'event', text: ['When any key pressed...'] },
  { id: '8', cat: 'event', text: ['When', OBJ('', 'input'), 'submitted...'] },
  { id: '10', cat: 'event', text: ['When', OBJ(''), 'changed...'] },
  { id: '9', cat: 'event', text: ['When message received...'] },
  { id: '14', cat: 'event', text: ['When cross-site message received...'] },
  { id: '7', cat: 'event', text: ['When', OBJ('', 'avataritem'), 'bought...'] },
  { id: '15', cat: 'event', text: ['When donation completed...'] },
  { id: '6', cat: 'functions', text: ['Define function', S('1', 'function')] }
];

/** Action blocks, in palette order. */
export const ACTION_TEMPLATES = [
  // Console
  { id: '0', cat: 'console', text: ['Log', BARE_ANY('Hello')] },
  { id: '1', cat: 'console', text: ['Warn', BARE_ANY('Careful')] },
  { id: '2', cat: 'console', text: ['Error', BARE_ANY('Something broke')] },

  // Logic
  { id: '3', cat: 'logic', text: ['Wait', N('1'), 'seconds'] },
  { id: '18', cat: 'logic', text: ['If', ANY('{1}'), 'is equal to', ANY('1')], opens: true },
  { id: '19', cat: 'logic', text: ['If', ANY('{1}'), 'is not equal to', ANY('1')], opens: true },
  { id: '20', cat: 'logic', text: ['If', ANY('{1}'), 'is greater than', ANY('1')], opens: true },
  { id: '125', cat: 'logic', text: ['If', ANY('{1}'), 'is greater or equal to', ANY('1')], opens: true },
  { id: '21', cat: 'logic', text: ['If', ANY('{1}'), 'is lower than', ANY('1')], opens: true },
  { id: '126', cat: 'logic', text: ['If', ANY('{1}'), 'is lower or equal to', ANY('1')], opens: true },
  { id: '37', cat: 'logic', text: ['If', S('{1}'), 'contains', S('text')], opens: true },
  { id: '38', cat: 'logic', text: ['If', S('{1}'), "doesn't contain", S('text')], opens: true },
  { id: '92', cat: 'logic', text: ['If', VAR(), 'exists'], opens: true },
  { id: '93', cat: 'logic', text: ['If', VAR(), "doesn't exist"], opens: true },
  { id: '44', cat: 'logic', text: ['If', VAR('1'), 'AND', VAR('2')], opens: true },
  { id: '45', cat: 'logic', text: ['If', VAR('1'), 'OR', VAR('2')], opens: true },
  { id: '46', cat: 'logic', text: ['If', VAR('1'), 'NOR', VAR('2')], opens: true },
  { id: '47', cat: 'logic', text: ['If', VAR('1'), 'XOR', VAR('2')], opens: true },
  { id: '112', cat: 'logic', text: ['else'] },

  // Loops
  { id: '22', cat: 'loops', text: ['Repeat', N('5'), 'times'], opens: true },
  { id: '23', cat: 'loops', text: ['Repeat forever'], opens: true },
  { id: '24', cat: 'loops', text: ['Break'] },
  { id: '25', cat: 'control', text: ['end'] },

  // Looks
  { id: '8', cat: 'looks', text: ['Make', OBJ(''), 'invisible'] },
  { id: '9', cat: 'looks', text: ['Make', OBJ(''), 'visible'] },
  { id: '10', cat: 'looks', text: ['Set', OBJ(''), 'text to', S('Hello')] },
  { id: '31', cat: 'looks', text: ['Set', S('Background Color', 'property'), 'of', OBJ(''), 'to', BARE_ANY('#ff0000')] },
  { id: '39', cat: 'looks', text: ['Get', S('Text', 'property'), 'of', OBJ(''), '→', VAR()] },
  { id: '88', cat: 'looks', text: ['Tween', S('Position', 'property'), 'of', OBJ(''), 'to', BARE_ANY('{0,0},{0,100}'), '-', N('0.3', 'time'), S('Quad', 'style'), S('Out', 'direction')] },
  { id: '106', cat: 'looks', text: ['Set', OBJ(''), 'image to', { value: '16944769468', t: 'id', assetbrowser: 'image' }] },
  { id: '30', cat: 'looks', text: ['Get text from', OBJ('', 'input'), '→', VAR()] },
  { id: '49', cat: 'looks', text: ['Duplicate', OBJ(''), '→', VAR()] },
  { id: '50', cat: 'looks', text: ['Delete', OBJ('')] },
  { id: '108', cat: 'looks', text: ['If dark theme enabled'], opens: true },

  // Hierarchy
  { id: '58', cat: 'hierarchy', text: ['Parent', OBJ(''), 'under', OBJ('')] },
  { id: '103', cat: 'hierarchy', text: ['If', OBJ(''), 'is ancestor of', OBJ('')], opens: true },
  { id: '104', cat: 'hierarchy', text: ['If', OBJ(''), 'is child of', OBJ('')], opens: true },
  { id: '105', cat: 'hierarchy', text: ['If', OBJ(''), 'is descendant of', OBJ('')], opens: true },

  // Navigation
  { id: '4', cat: 'navigation', text: ['Redirect to', { value: 'home.rbx', t: 'string', href: 'true' }] },
  { id: '117', cat: 'navigation', text: ['Get URL', '→', VAR()] },

  // Math & Variables
  { id: '11', cat: 'variables', text: ['Set', VAR(), 'to', ANY('0')] },
  { id: '12', cat: 'variables', text: ['Increase', VAR(), 'by', N('1')] },
  { id: '13', cat: 'variables', text: ['Decrease', VAR(), 'by', N('1')] },
  { id: '14', cat: 'variables', text: ['Multiply', VAR(), 'by', N('2')] },
  { id: '15', cat: 'variables', text: ['Divide', VAR(), 'by', N('2')] },
  { id: '40', cat: 'variables', text: ['Raise', VAR(), 'to the power of', N('2')] },
  { id: '41', cat: 'variables', text: [VAR(), 'modulo', N('2')] },
  { id: '16', cat: 'variables', text: ['Round', VAR()] },
  { id: '17', cat: 'variables', text: ['Floor', VAR()] },
  { id: '78', cat: 'variables', text: ['Ceil', VAR()] },
  { id: '27', cat: 'variables', text: ['Set', S('1', 'var'), 'to random', N('1', 'n'), '-', N('10', 'n')] },
  { id: '114', cat: 'variables', text: ['Run math function', S('sin', 'function'), { value: [], t: 'tuple' }, '→', VAR()] },
  { id: '96', cat: 'variables', text: ['Delete', VAR()] },

  // Audio
  { id: '5', cat: 'audio', text: ['Play audio', { value: '88442833509532', t: 'string', l: 'id', assetbrowser: 'audio' }, '→', S('', 'variable?')] },
  { id: '26', cat: 'audio', text: ['Play looped audio', { value: '88442833509532', t: 'string', l: 'id', assetbrowser: 'audio' }, '→', S('', 'variable?')] },

  // Input
  { id: '79', cat: 'input', text: ['If left mouse button down'], opens: true },
  { id: '80', cat: 'input', text: ['If middle mouse button down'], opens: true },
  { id: '81', cat: 'input', text: ['If right mouse button down'], opens: true },
  { id: '82', cat: 'input', text: ['If', { value: 'E', t: 'key' }, 'down'], opens: true },
  { id: '84', cat: 'input', text: ['Get viewport size', '→', S('1', 'x'), S('2', 'y')] },
  { id: '85', cat: 'input', text: ['Get cursor position', '→', S('1', 'x'), S('2', 'y')] },

  // Network
  { id: '32', cat: 'network', text: ['Broadcast', S('msg'), 'across page'] },
  { id: '33', cat: 'network', text: ['Broadcast', S('msg'), 'across site'] },

  // Cookies
  { id: '34', cat: 'cookies', text: ['Set cookie', S('ck', 'cookie'), 'to', BARE_ANY('value')] },
  { id: '36', cat: 'cookies', text: ['Get cookie', S('ck', 'cookie'), '→', VAR()] },
  { id: '62', cat: 'cookies', text: ['Delete cookie', S('ck', 'cookie')] },

  // Color
  { id: '119', cat: 'color', text: ['Convert', S('#ffffff', 'hex'), 'to RGB', '→', VAR()] },
  { id: '121', cat: 'color', text: ['Convert RGB', S('255,255,255', 'rgb'), 'to hex', '→', VAR()] },

  // Strings
  { id: '42', cat: 'strings', text: ['Sub', VAR(), N('1', 'start'), '-', N('5', 'end')] },
  { id: '43', cat: 'strings', text: ['Replace', S('old'), 'in', VAR(), 'by', S('new')] },
  { id: '48', cat: 'strings', text: ['Get length of', S('text'), '→', VAR()] },
  { id: '57', cat: 'strings', text: ['Split', S('a,b'), S(',', 'separator'), '→', S('1', 'table')] },
  { id: '69', cat: 'strings', text: ['Lower', S('TEXT'), '→', VAR()] },
  { id: '70', cat: 'strings', text: ['Upper', S('text'), '→', VAR()] },
  { id: '109', cat: 'strings', text: ['Concatenate', S('a'), 'with', S('b'), '→', VAR()] },

  // Tables
  { id: '54', cat: 'tables', text: ['Create table', S('1', 'table')] },
  { id: '55', cat: 'tables', text: ['Set entry', S('key', 'entry'), 'of', S('1', 'table'), 'to', ANY('value')] },
  { id: '66', cat: 'tables', text: ['Set entry', S('key', 'entry'), 'of', S('1', 'table'), 'to', OBJ('')] },
  { id: '56', cat: 'tables', text: ['Get entry', S('key', 'entry'), 'of', S('1', 'table'), '→', VAR('2')] },
  { id: '90', cat: 'tables', text: ['Delete entry', S('key', 'entry'), 'of', S('1', 'table')] },
  { id: '89', cat: 'tables', text: ['Insert', ANY('value'), 'at position', N('', 'number?'), 'of', S('1', 'array')] },
  { id: '91', cat: 'tables', text: ['Remove entry at position', N('', 'number?'), 'of', S('1', 'array')] },
  { id: '59', cat: 'tables', text: ['Get length of', S('1', 'array'), '→', VAR('2')] },
  { id: '113', cat: 'tables', text: ['Iterate through', S('1', 'table'), '({l!index},{l!value})'], opens: true },
  { id: '110', cat: 'tables', text: ['Join', S('1', 'array'), 'using', S(',', 'string'), '→', VAR('2')] },

  // Functions
  { id: '87', cat: 'functions', text: ['Run function', S('1', 'function'), { value: [], t: 'tuple' }, '→', S('', 'variable?')] },
  { id: '115', cat: 'functions', text: ['Return', ANY('0')] }
];

const ACTION_BY_ID = new Map(ACTION_TEMPLATES.map((t) => [t.id, t]));
const EVENT_BY_ID = new Map(EVENT_TEMPLATES.map((t) => [t.id, t]));

/** Opens a C-block body that is closed by `end` (25). */
export const OPENER_IDS = new Set(ACTION_TEMPLATES.filter((t) => t.opens).map((t) => t.id));

/** Category colour/name for an action id (unknown ids fall back to Control). */
export function actionCategory(id) {
  return CATEGORIES[ACTION_BY_ID.get(String(id))?.cat || 'control'];
}

/** Category for an event id ("Define function" is shown as a Functions hat). */
export function eventCategory(id) {
  return CATEGORIES[EVENT_BY_ID.get(String(id))?.cat || 'event'];
}

/** Deep copy of a template's `text`, ready to insert. */
export function cloneText(template) {
  return JSON.parse(JSON.stringify(template.text));
}

/** Short label for palette search ("If … is equal to …"). */
export function templateLabel(template) {
  return template.text.map((t) => (typeof t === 'string' ? t : '…')).join(' ').replace(/\s+/g, ' ').trim();
}
