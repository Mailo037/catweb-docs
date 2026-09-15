#!/usr/bin/env node
/**
 * CatWeb JSON Web Runner & Renderer - Standalone CLI Test Runner
 * Executes Tier 1-4 test suites with zero external dependencies and clear ANSI colored reports.
 *
 * Usage:
 *   node web-runner/tests/runner.js
 */

import { registry } from './harness.js';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  white: '\x1b[37m'
};

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  CatWeb JSON Web Runner & Renderer — E2E Test Runner ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

  // Load all 4 test suites
  console.log(`${colors.dim}Loading test suites...${colors.reset}`);
  await import('./tier1_features.test.js');
  await import('./tier2_boundaries.test.js');
  await import('./tier3_combinations.test.js');
  await import('./tier4_samples.test.js');

  const failures = [];

  const onProgress = (testResult) => {
    if (testResult.passed) {
      process.stdout.write(`${colors.green}•${colors.reset}`);
    } else {
      process.stdout.write(`${colors.red}F${colors.reset}`);
      failures.push(testResult);
    }
  };

  process.stdout.write('Running tests: ');
  const results = await registry.runAll(onProgress);
  process.stdout.write('\n\n');

  // Print hierarchy
  function printSuite(suite, indent = 0) {
    const pad = '  '.repeat(indent);
    console.log(`${pad}${colors.bold}${colors.blue}▶ ${suite.name}${colors.reset}`);

    for (const t of suite.tests) {
      const mark = t.passed
        ? `${colors.green}✔ PASS${colors.reset}`
        : `${colors.red}✖ FAIL${colors.reset}`;
      const timeStr = `${colors.dim}(${t.durationMs}ms)${colors.reset}`;
      console.log(`${pad}  ${mark} ${t.name} ${timeStr}`);
    }

    for (const sub of suite.suites) {
      printSuite(sub, indent + 1);
    }
  }

  for (const s of results.suites) {
    printSuite(s);
  }

  // Print failures if any
  if (failures.length > 0) {
    console.log(`\n${colors.bold}${colors.red}--- FAILURES (${failures.length}) ---${colors.reset}\n`);
    failures.forEach((f, idx) => {
      console.log(`${colors.bold}${colors.red}${idx + 1}) ${f.fullTitle}${colors.reset}`);
      console.log(`   ${colors.red}${f.error?.message || f.error}${colors.reset}`);
      if (f.error?.stack) {
        const stackLines = f.error.stack.split('\n').slice(1, 4).join('\n   ');
        console.log(`   ${colors.dim}${stackLines}${colors.reset}`);
      }
      console.log('');
    });
  }

  // Summary Report
  console.log(`\n${colors.bold}------------------------------------------------------${colors.reset}`);
  console.log(`${colors.bold}Test Execution Summary:${colors.reset}`);
  console.log(`  Total Tests:    ${colors.bold}${results.total}${colors.reset}`);
  console.log(`  Passed:         ${colors.green}${colors.bold}${results.passed}${colors.reset}`);
  console.log(`  Failed:         ${results.failed > 0 ? colors.red : colors.green}${colors.bold}${results.failed}${colors.reset}`);
  console.log(`  Execution Time: ${results.durationMs} ms`);
  console.log(`${colors.bold}------------------------------------------------------${colors.reset}\n`);

  if (results.failed === 0) {
    console.log(`${colors.bgGreen}${colors.white}${colors.bold} SUCCESS ${colors.reset} ${colors.green}All test assertions passed flawlessly!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bgRed}${colors.white}${colors.bold} FAILURE ${colors.reset} ${colors.red}${results.failed} test(s) failed.${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${colors.red}Fatal test runner error:${colors.reset}`, err);
  process.exit(1);
});
