#!/usr/bin/env node

/**
 * Translation Key Parity Verification Script
 * 
 * This script verifies that all translation keys exist in both English and Hebrew
 * sections of the translations.ts file. It helps maintain consistency between
 * language versions and ensures no keys are accidentally missed during updates.
 * 
 * Usage: node scripts/verify-translations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const translationsPath = path.join(__dirname, '../client/src/lib/translations.ts');

try {
  // Read the translations file
  const content = fs.readFileSync(translationsPath, 'utf-8');

  // Extract the en and he objects using regex
  const enMatch = content.match(/en:\s*\{([\s\S]*?)\n\s*\},\n\s*he:/);
  const heMatch = content.match(/he:\s*\{([\s\S]*?)\n\s*\}/);

  if (!enMatch || !heMatch) {
    console.error('❌ Error: Could not parse translations from file');
    process.exit(1);
  }

  // Function to extract keys from an object string
  function extractKeys(objectStr) {
    const keys = new Set();
    // Match patterns like "keyName:" or "  keyName:" (with various whitespace)
    const keyPattern = /^\s*(\w+):/gm;
    let match;
    while ((match = keyPattern.exec(objectStr)) !== null) {
      keys.add(match[1]);
    }
    return keys;
  }

  const enKeys = extractKeys(enMatch[1]);
  const heKeys = extractKeys(heMatch[1]);

  console.log('\n=== TRANSLATION KEY PARITY VERIFICATION ===\n');
  console.log(`English keys: ${enKeys.size}`);
  console.log(`Hebrew keys: ${heKeys.size}`);

  // Find missing keys
  const enMissing = Array.from(enKeys).filter(key => !heKeys.has(key)).sort();
  const heMissing = Array.from(heKeys).filter(key => !enKeys.has(key)).sort();

  let hasMismatches = false;
  let exitCode = 0;

  if (enMissing.length > 0) {
    hasMismatches = true;
    exitCode = 1;
    console.log(`\n❌ Keys in 'en' but missing in 'he' (${enMissing.length}):`);
    enMissing.forEach(key => console.log(`  - ${key}`));
  }

  if (heMissing.length > 0) {
    hasMismatches = true;
    exitCode = 1;
    console.log(`\n❌ Keys in 'he' but missing in 'en' (${heMissing.length}):`);
    heMissing.forEach(key => console.log(`  - ${key}`));
  }

  if (!hasMismatches) {
    console.log(`\n✅ All keys are in parity! No mismatches found.`);
  }

  console.log('\n');
  process.exit(exitCode);
} catch (error) {
  console.error('❌ Error reading translations file:', error.message);
  process.exit(1);
}
