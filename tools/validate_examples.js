import fs from 'node:fs';
import path from 'node:path';
import { validateCatWeb } from './validate.js';

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
  const result = validateCatWeb(raw, { strict: false });

  if (!result.valid) {
    for (const err of result.errors) {
      console.error(`FAIL at ${err.path}: [${err.code}] ${err.message}`);
      totalErrors++;
    }
  } else {
    console.log('PASS: All CatWeb schema invariants satisfied');
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    continue;
  }

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
            if (act.id === '5' || act.id === '26') soundFound = true;
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
      console.error(`FAIL: interactive_counter missing Play audio (id: "5")`);
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
