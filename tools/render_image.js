#!/usr/bin/env node
/**
 * CatWeb AI Image Render CLI
 *
 * Takes CatWeb JSON input and generates either:
 *   - An image file (SVG/PNG) on success, OR
 *   - Formatted diagnostic errors on stderr with exit code 1.
 *
 * Usage:
 *   node tools/render_image.js <input.json> [output.svg]
 *   node tools/render_image.js <input.json> --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { handleRenderPayload } from './api_server.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
Usage:
  node tools/render_image.js <input.json> [output.svg]
  node tools/render_image.js <input.json> --json

Description:
  Renders CatWeb JSON into an image or outputs validation diagnostics.
    `);
    process.exit(0);
  }

  const inputFile = args[0];
  const outputTarget = args[1];

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(inputFile, 'utf-8');
  const result = handleRenderPayload(rawContent);

  if (result.statusCode !== 200 || !result.body.success) {
    console.error(`\n❌ Render Failed: ${result.body.errors.length} error(s) found:\n`);
    for (const err of result.body.errors) {
      console.error(`  - [${err.code}] ${err.message} (${err.path})`);
    }
    process.exit(1);
  }

  // If outputTarget is --json, print full JSON result with dataUrl
  if (outputTarget === '--json') {
    console.log(JSON.stringify(result.body, null, 2));
    process.exit(0);
  }

  // If output file specified, write SVG
  if (outputTarget) {
    fs.writeFileSync(outputTarget, result.rawSvg, 'utf-8');
    console.log(`\n✔ Rendered image successfully written to: ${outputTarget}`);
    console.log(`  Format: ${result.body.format}`);
    console.log(`  Elements: ${result.body.elementCount}`);
    process.exit(0);
  }

  // Default: write to <input>_render.svg
  const defaultOutput = inputFile.replace(/\.json$/i, '') + '_render.svg';
  fs.writeFileSync(defaultOutput, result.rawSvg, 'utf-8');
  console.log(`\n✔ Rendered image written to: ${defaultOutput}`);
  console.log(`  Format: ${result.body.format}`);
  console.log(`  Elements: ${result.body.elementCount}`);
}

main().catch(err => {
  console.error('Fatal CLI error:', err);
  process.exit(1);
});
