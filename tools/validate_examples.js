import fs from 'node:fs';
import path from 'node:path';

const filesToValidate = [
  'skills/catweb/examples/minimal_site.json',
  'skills/catweb/examples/interactive_counter.json',
  '.agents/skills/catweb/examples/minimal_site.json',
  '.agents/skills/catweb/examples/interactive_counter.json'
];

let totalErrors = 0;

for (const relPath of filesToValidate) {
  const fullPath = path.resolve(relPath);
  console.log(`\n--- Deep Validating ${relPath} ---`);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`FAIL: File does not exist: ${fullPath}`);
    totalErrors++;
    continue;
  }

  const raw = fs.readFileSync(fullPath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
    console.log('PASS: Valid JSON syntax');
  } catch (err) {
    console.error(`FAIL: Invalid JSON syntax: ${err.message}`);
    totalErrors++;
    continue;
  }

  // Check root fields
  const requiredRootKeys = ['favicon', 'title', 'background', 'webcontent'];
  for (const k of requiredRootKeys) {
    if (!(k in data)) {
      console.error(`FAIL: Missing required root key: "${k}"`);
      totalErrors++;
    }
  }

  if (!Array.isArray(data.webcontent) || data.webcontent.length !== 1) {
    console.error(`FAIL: "webcontent" must be an array with exactly 1 root element`);
    totalErrors++;
  }

  // Walk through the object to check invariants
  const seenGlobalIds = new Map();
  const globalIdRegex = /^[A-Za-z0-9]{2,3}$/;
  const hexColorRegex = /^#[0-9a-fA-F]{3,8}$/;

  function walk(node, currentPath = '$') {
    if (node === null) {
      console.error(`FAIL at ${currentPath}: Raw null scalar found! All scalars must be strings.`);
      totalErrors++;
      return;
    }

    if (typeof node === 'number' || typeof node === 'boolean') {
      console.error(`FAIL at ${currentPath}: Raw ${typeof node} scalar (${node}) found! All scalars must be quoted strings.`);
      totalErrors++;
      return;
    }

    if (typeof node === 'string') {
      if (/^[0-9a-fA-F]{6}$/.test(node) && (currentPath.includes('color') || currentPath.includes('background'))) {
        console.error(`FAIL at ${currentPath}: Hex color missing '#' prefix: "${node}"`);
        totalErrors++;
      }
      return;
    }

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        walk(node[i], `${currentPath}[${i}]`);
      }
      return;
    }

    if (typeof node === 'object') {
      for (const [key, val] of Object.entries(node)) {
        if (key === 'layout_order') {
          console.error(`FAIL at ${currentPath}: Forbidden key "layout_order" found! Must be "order".`);
          totalErrors++;
        }
        if (key === 'cell_size') {
          console.error(`FAIL at ${currentPath}: Forbidden key "cell_size" found! Must be "size".`);
          totalErrors++;
        }
        if (key.includes('color') && typeof val === 'string' && val.startsWith('#')) {
          if (!hexColorRegex.test(val)) {
            console.error(`FAIL at ${currentPath}.${key}: Invalid hex color format: "${val}"`);
            totalErrors++;
          }
        }
        if (key === 'globalid') {
          if (typeof val !== 'string' || !globalIdRegex.test(val)) {
            console.error(`FAIL at ${currentPath}: Invalid globalid format: "${val}". Must match ^[A-Za-z0-9]{2,3}$`);
            totalErrors++;
          } else {
            if (seenGlobalIds.has(val)) {
              console.error(`FAIL at ${currentPath}: Duplicate globalid found: "${val}" (previously at ${seenGlobalIds.get(val)})`);
              totalErrors++;
            } else {
              seenGlobalIds.set(val, currentPath);
            }
          }
        }

        // Script block checks
        if (node.id) {
          // Control flow flat invariant
          if (['18', '19', '20', '21', '125', '126', '22', '23'].includes(node.id)) {
            if (node.actions) {
              console.error(`FAIL at ${currentPath}: Control flow action (${node.id}) must NOT have nested actions array!`);
              totalErrors++;
            }
          }

          // Set property action (31) Title Case check
          if (node.id === '31' && Array.isArray(node.text)) {
            const propObj = node.text.find(item => typeof item === 'object' && item.t === 'property');
            if (propObj) {
              const firstChar = propObj.value.charAt(0);
              if (firstChar !== firstChar.toUpperCase() || propObj.value.includes('_')) {
                console.error(`FAIL at ${currentPath}: Script property name "${propObj.value}" must be Title Case (e.g. "Text"), not snake_case!`);
                totalErrors++;
              }
            }
          }

          // Play sound action (48)
          if (node.id === '48' && Array.isArray(node.text)) {
            const soundObj = node.text.find(item => typeof item === 'object' && (item.t === 'id' || item.assetbrowser === 'sound'));
            if (!soundObj || !soundObj.value || !/^\d+$/.test(soundObj.value)) {
              console.error(`FAIL at ${currentPath}: Play sound (48) missing valid numeric sound asset ID!`);
              totalErrors++;
            }
          }

          // Variable checks for moderation safety
          if (['11', '12', '13', '14', '15'].includes(node.id) && Array.isArray(node.text)) {
            const varObj = node.text.find(item => typeof item === 'object' && item.l === 'variable');
            if (varObj && !/^\d+$/.test(varObj.value)) {
              console.warn(`WARN at ${currentPath}: Variable "${varObj.value}" is not numeric. Anti-moderation guideline recommends numbers.`);
            }
          }
        }

        walk(val, `${currentPath}.${key}`);
      }
    }
  }

  walk(data);
  console.log(`Global IDs checked: ${seenGlobalIds.size} unique IDs`);

  // Architecture-specific checks
  if (relPath.includes('minimal_site')) {
    const rootEl = data.webcontent[0];
    if (rootEl.class !== 'Frame') {
      console.error(`FAIL: minimal_site root element must be Frame`);
      totalErrors++;
    }
    const children = rootEl.children || [];
    const navbar = children.find(c => c.alias === 'navbar');
    const scroller = children.find(c => c.class === 'ScrollingFrame');
    if (!navbar) {
      console.error(`FAIL: minimal_site missing navbar Frame child`);
      totalErrors++;
    }
    if (!scroller) {
      console.error(`FAIL: minimal_site missing ScrollingFrame sibling of navbar`);
      totalErrors++;
    } else {
      if (scroller.canvassize !== 'auto_y') {
        console.error(`FAIL: ScrollingFrame must have canvassize: "auto_y"`);
        totalErrors++;
      }
    }
  }

  if (relPath.includes('interactive_counter')) {
    const rootEl = data.webcontent[0];
    let scriptFound = false;
    let buttonEventFound = false;
    let addVarFound = false;
    let setPropertyFound = false;
    let soundFound = false;

    function checkScript(node) {
      if (node.class === 'script') {
        scriptFound = true;
        for (const evt of node.content || []) {
          if (evt.id === '1') buttonEventFound = true;
          for (const act of evt.actions || []) {
            if (act.id === '12') addVarFound = true;
            if (act.id === '31') setPropertyFound = true;
            if (act.id === '48') soundFound = true;
          }
        }
      }
      if (Array.isArray(node.children)) {
        for (const c of node.children) checkScript(c);
      }
    }

    checkScript(rootEl);

    if (!scriptFound) {
      console.error(`FAIL: interactive_counter missing script element`);
      totalErrors++;
    }
    if (!buttonEventFound) {
      console.error(`FAIL: interactive_counter missing button click event (id: "1")`);
      totalErrors++;
    }
    if (!addVarFound) {
      console.error(`FAIL: interactive_counter missing variable increment (id: "12")`);
      totalErrors++;
    }
    if (!setPropertyFound) {
      console.error(`FAIL: interactive_counter missing Set Property (id: "31")`);
      totalErrors++;
    }
    if (!soundFound) {
      console.error(`FAIL: interactive_counter missing Play Sound (id: "48")`);
      totalErrors++;
    }
  }

  if (totalErrors === 0) {
    console.log(`PASS: All deep checks passed for ${relPath}`);
  }
}

if (totalErrors > 0) {
  console.error(`\nTOTAL ERRORS: ${totalErrors}`);
  process.exit(1);
} else {
  console.log('\nALL DEEP CHECKS PASSED WITH 0 ERRORS!');
  process.exit(0);
}
