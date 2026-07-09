#!/usr/bin/env node

/*
 * Validates the error-code registry in `errors/codes/`.
 *
 * The set of `<code>.md` files in `errors/codes/` is the source of truth for
 * which error codes are valid. This script enforces the invariants that must
 * hold for every file. `protocol/errors.json` is generated from these files
 * (see generate-errors-json.js), so it isn't cross-checked here — the CI
 * drift guard (regenerate and diff) keeps it in sync.
 *
 * Two tiers:
 *   - Errors fail CI (exit 1): unparseable frontmatter, missing/blank `code`,
 *     `identifier`, `title`, or `summary`, filename/`code` mismatch, non-integer
 *     `code`, and a malformed or duplicate `identifier`.
 *   - Warnings do not fail CI: soft length checks on `title`/`summary` per
 *     guidelines.md.
 *
 * A valid registry entry requires `code`, `identifier`, `title`, and `summary`
 * (per guidelines.md); a Markdown body is optional.
 */

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./frontmatter');

const ERRORS_DIR = path.resolve(__dirname, '..');
const CODES_DIR = path.join(ERRORS_DIR, 'codes');

const errors = [];
const warnings = [];
const identifiers = new Map();

const fail = (file, message) => errors.push(`${file}: ${message}`);
const warn = (file, message) => warnings.push(`${file}: ${message}`);

/**
 * Count whitespace-separated words in a string.
 *
 * @param {string} text - The text to count.
 * @returns {number} The number of words.
 */
function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Validate a single `<code>.md` registry file, recording errors and warnings.
 *
 * @param {string} fileName - The file name within the codes directory.
 * @returns {string | null} The validated code, or null if it could not be read.
 */
function validateFile(fileName) {
  const codeFromName = fileName.replace(/\.md$/, '');
  const content = fs.readFileSync(path.join(CODES_DIR, fileName), 'utf8');
  const parsed = parseFrontmatter(content);

  if (parsed.error) {
    fail(fileName, parsed.error);
    return null;
  }
  const { fields } = parsed;

  // code
  if (!fields.code) {
    fail(fileName, 'missing required `code` frontmatter field');
  } else if (!/^\d+$/.test(fields.code)) {
    fail(fileName, `\`code\` must be an integer, got "${fields.code}"`);
  } else if (fields.code !== codeFromName) {
    fail(fileName, `\`code\` (${fields.code}) does not match filename`);
  }

  // identifier — required; a stable snake_case name, unique across the registry,
  // used as the canonical basis for the constant each SDK generates.
  if (!fields.identifier || fields.identifier.trim() === '') {
    fail(fileName, 'missing required `identifier` frontmatter field');
  } else if (!/^[a-z][a-z0-9_]*$/.test(fields.identifier)) {
    fail(fileName, `\`identifier\` must match ^[a-z][a-z0-9_]*$, got "${fields.identifier}"`);
  } else if (identifiers.has(fields.identifier)) {
    fail(fileName, `\`identifier\` "${fields.identifier}" is already used by ${identifiers.get(fields.identifier)}`);
  } else {
    identifiers.set(fields.identifier, fileName);
  }

  // title
  if (!fields.title || fields.title.trim() === '') {
    fail(fileName, 'missing required `title` frontmatter field');
  } else if (wordCount(fields.title) > 10) {
    warn(fileName, `title is ${wordCount(fields.title)} words (guideline: 3–7, hard cap 10)`);
  }

  // summary — required per guidelines.md; length checked against the guideline
  // range when present.
  if (fields.summary === undefined || fields.summary === '') {
    fail(fileName, 'missing required `summary` frontmatter field');
  } else {
    const words = wordCount(fields.summary);
    if (words < 15 || words > 40) {
      warn(fileName, `summary is ${words} words (guideline: 15–40)`);
    }
  }

  return fields.code && /^\d+$/.test(fields.code) ? fields.code : null;
}

/**
 * Validate every file in the registry and report the outcome, exiting non-zero
 * if any hard errors were found.
 *
 * @returns {void}
 */
function main() {
  if (!fs.existsSync(CODES_DIR)) {
    console.error(`No codes directory at ${CODES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CODES_DIR).filter((f) => f.endsWith('.md'));
  files.forEach(validateFile);
  const codeCount = files.length;

  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  }
  if (errors.length) {
    console.error(`\n${errors.length} error(s):`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    console.error('\nError registry validation failed.');
    process.exit(1);
  }
  console.log(`\n✓ Error registry valid: ${codeCount} code(s) in errors/codes/.`);
}

main();
