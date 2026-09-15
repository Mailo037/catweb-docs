/**
 * Preloaded Fixture Data for Headless Node and In-Browser file:// execution
 */

import fs from 'node:fs';
import path from 'node:path';

function loadFixture(relPath) {
  // If running in Node environment
  if (typeof process !== 'undefined' && process.cwd) {
    const candidates = [
      path.resolve(process.cwd(), relPath),
      path.resolve(process.cwd(), '..', '..', relPath),
      path.resolve(relPath)
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf8');
      }
    }
  }
  return null;
}

export const FIXTURE_MINIMAL_SITE_JSON = loadFixture('skills/catweb/examples/minimal_site.json');
export const FIXTURE_INTERACTIVE_COUNTER_JSON = loadFixture('skills/catweb/examples/interactive_counter.json');
export const FIXTURE_USER_SNIPPET_JSON = loadFixture('tools/test_fixtures/user_snippet.json');
export const FIXTURE_VALID_SNIPPET_JSON = loadFixture('tools/test_fixtures/valid_snippet.json');
export const FIXTURE_INVALID_EXAMPLES_JSON = loadFixture('tools/test_fixtures/invalid_examples.json');
