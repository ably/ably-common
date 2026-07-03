#!/usr/bin/env node

/*
 * Validates the error-code registry in `errors/codes/`.
 *
 * The set of `<code>.md` files in `errors/codes/` is the source of truth for
 * which error codes are valid. This script enforces the invariants that must
 * hold for every file, and cross-checks completeness against the legacy
 * `protocol/errors.json` map while that still exists.
 *
 * Two tiers:
 *   - Errors fail CI (exit 1): unparseable frontmatter, missing/blank `code`,
 *     `identifier`, `title`, or `summary`, filename/`code` mismatch, non-integer
 *     `code`, a malformed or duplicate `identifier`, and any `errors.json` code
 *     with no `codes/<code>.md` (completeness).
 *   - Warnings do not fail CI: a `codes/<code>.md` whose code is absent from
 *     `errors.json` (curated ahead of the map, or the map is being retired),
 *     and soft length checks on `title`/`summary` per guidelines.md.
 *
 * A valid registry entry requires `code`, `identifier`, `title`, and `summary`
 * (per guidelines.md); a Markdown body is optional.
 */

const fs = require('fs');
const path = require('path');

const ERRORS_DIR = path.resolve(__dirname, '..');
const CODES_DIR = path.join(ERRORS_DIR, 'codes');
const ERRORS_JSON = path.resolve(ERRORS_DIR, '..', 'protocol', 'errors.json');

const errors = [];
const warnings = [];
const identifiers = new Map();

const fail = (file, message) => errors.push(`${file}: ${message}`);
const warn = (file, message) => warnings.push(`${file}: ${message}`);

/**
 * Parse the constrained YAML frontmatter used by these files: a `---` fence,
 * then one `key: value` per line, then a closing `---`. Values may contain
 * colons (we split on the first `: ` only) and may be wrapped in double quotes.
 *
 * @param {string} content - The full file contents.
 * @returns {{ fields: object, hasBody: boolean } | { error: string }} Parsed
 *   frontmatter fields and whether a body follows, or an error description.
 */
function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return { error: 'missing opening `---` frontmatter fence' };
  }
  const rest = content.slice(4);
  const end = rest.indexOf('\n---');
  if (end === -1) {
    return { error: 'missing closing `---` frontmatter fence' };
  }
  const block = rest.slice(0, end);
  const body = rest.slice(end + 4).replace(/^\n+/, '');
  const fields = {};
  block.split('\n').forEach((raw) => {
    const line = raw.trimEnd();
    if (line === '') return;
    const sep = line.indexOf(': ');
    const key = sep === -1 ? line.replace(/:$/, '') : line.slice(0, sep);
    let value = sep === -1 ? '' : line.slice(sep + 2);
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }
    fields[key.trim()] = value;
  });
  return { fields, hasBody: body.trim().length > 0 };
}

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
  const present = new Set();
  files.forEach((file) => {
    const code = validateFile(file);
    if (code) present.add(code);
  });

  // Completeness + reverse cross-check against the legacy errors.json map.
  if (fs.existsSync(ERRORS_JSON)) {
    const map = JSON.parse(fs.readFileSync(ERRORS_JSON, 'utf8'));
    const jsonCodes = new Set(Object.keys(map));

    [...jsonCodes]
      .filter((c) => !present.has(c))
      .sort((a, b) => a - b)
      .forEach((code) => {
        fail('registry', `errors.json defines ${code} ("${map[code]}") but codes/${code}.md is missing`);
      });

    [...present]
      .filter((c) => !jsonCodes.has(c))
      .sort((a, b) => a - b)
      .forEach((code) => {
        warn(`codes/${code}.md`, 'code is not present in protocol/errors.json');
      });
  } else {
    warn('registry', 'protocol/errors.json not found; skipping completeness cross-check');
  }

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
  console.log(`\n✓ Error registry valid: ${present.size} code(s) in errors/codes/.`);
}

main();
