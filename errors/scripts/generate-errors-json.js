#!/usr/bin/env node

/*
 * Generates `protocol/errors.json` from the error registry in `errors/codes/`.
 *
 * The registry (`codes/<code>.md`) is the source of truth; errors.json is a
 * derived, machine-readable view of it — a map of code to `{ identifier, title,
 * summary }`. Do not edit errors.json by hand: run `npm run generate:errors`.
 * CI regenerates it and fails if the committed file differs (the drift guard).
 */

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./frontmatter');

const CODES_DIR = path.resolve(__dirname, '..', 'codes');
const OUT = path.resolve(__dirname, '..', '..', 'protocol', 'errors.json');

const REQUIRED = ['code', 'identifier', 'title', 'summary'];

/**
 * Build the errors.json object from the registry files.
 *
 * @returns {object} The generated structure: `{ $schema, _comment, codes }`.
 */
function build() {
  const files = fs.readdirSync(CODES_DIR).filter((f) => f.endsWith('.md'));
  const codes = {};
  files
    .map((f) => f.replace(/\.md$/, ''))
    .sort((a, b) => Number(a) - Number(b))
    .forEach((code) => {
      const content = fs.readFileSync(path.join(CODES_DIR, `${code}.md`), 'utf8');
      const parsed = parseFrontmatter(content);
      if (parsed.error) {
        throw new Error(`${code}.md: ${parsed.error}`);
      }
      const { fields } = parsed;
      const missing = REQUIRED.filter((k) => !fields[k]);
      if (missing.length) {
        throw new Error(`${code}.md: missing frontmatter field(s): ${missing.join(', ')}`);
      }
      codes[code] = {
        identifier: fields.identifier,
        title: fields.title,
        summary: fields.summary,
      };
    });
  return {
    $schema: '../json-schemas/src/errors.json',
    _comment: 'Generated from errors/codes/*.md by errors/scripts/generate-errors-json.js. Do not edit by hand; create and update files in errors/codes/*.md and run `npm run generate:errors`.',
    codes,
  };
}

fs.writeFileSync(OUT, `${JSON.stringify(build(), null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), OUT)}`);
