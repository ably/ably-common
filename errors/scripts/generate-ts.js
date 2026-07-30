#!/usr/bin/env node

/*
 * Generates TypeScript error-code declarations from the registry in
 * `errors/codes/`.
 *
 * The generator lives here; each SDK runs it against its vendored copy of this
 * repository, commits the output into its own `src/`, and its CI regenerates at
 * the pinned submodule commit and fails on a diff. Two output shapes:
 *
 *   --format=type   a bare `ErrorCode` union of numeric literals, for consumers
 *                   that want compile-time checking at zero runtime cost.
 *   --format=const  one `export const` per code plus an `ErrorCode` union, for
 *                   consumers that need the values at runtime. Individual
 *                   consts rather than an object or a TS `enum` so that unused
 *                   codes tree-shake out of browser bundles.
 *
 * Output is deterministic — sorted by numeric code, byte-identical for a given
 * registry state — because the consumers' drift check diffs it.
 *
 * No dependencies beyond `fs`, `path`, and the local `frontmatter.js`, so this
 * runs from a superproject without an `npm install` inside the submodule.
 */

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./frontmatter');

const CODES_DIR = path.resolve(__dirname, '..', 'codes');

const REQUIRED = ['code', 'identifier', 'title', 'summary'];
const FORMATS = ['type', 'const'];

const HEADER = [
  '// GENERATED FROM ably-common/errors/codes — DO NOT EDIT.',
  '// Regenerate with: npm run generate:errorcodes-ts',
];

const USAGE = 'Usage: node errors/scripts/generate-ts.js --format=type|const [--out <path>]';

/** Width available for JSDoc prose, after the leading ` * `. */
const DOC_WIDTH = 76;

/**
 * A failure whose message is meant for whoever ran the generator: a bad
 * argument, or a registry that can't be turned into valid TypeScript.
 *
 * `main` prints these as a plain message and exits 1. Anything else keeps its
 * stack, because it's a bug in the generator rather than a problem with the
 * input.
 */
class GeneratorError extends Error {}

/**
 * Convert a registry `identifier` to the PascalCase name used for its constant.
 *
 * @param {string} identifier - A `snake_case` registry identifier.
 * @returns {string} The PascalCase equivalent.
 */
function pascalCase(identifier) {
  return identifier
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Read every `<code>.md` in the registry, in ascending numeric code order.
 *
 * @param {string} [dir] - The directory to read; defaults to `errors/codes`.
 * @returns {Array<object>} One `{ code, identifier, title, summary }` per entry.
 */
function loadEntries(dir = CODES_DIR) {
  if (!fs.existsSync(dir)) {
    throw new GeneratorError(`no error registry at ${dir}: if this is a vendored copy of ably-common, the submodule may be uninitialised or pinned to a commit predating errors/codes/`);
  }
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort((a, b) => Number(a) - Number(b))
    .map((code) => {
      let content;
      try {
        content = fs.readFileSync(path.join(dir, `${code}.md`), 'utf8');
      } catch (err) {
        throw new GeneratorError(`could not read ${code}.md: ${err.message}`);
      }
      const parsed = parseFrontmatter(content);
      if (parsed.error) {
        throw new GeneratorError(`${code}.md: ${parsed.error}`);
      }
      const { fields } = parsed;
      const missing = REQUIRED.filter((k) => !fields[k]);
      if (missing.length) {
        throw new GeneratorError(`${code}.md: missing frontmatter field(s): ${missing.join(', ')}`);
      }
      return {
        code: Number(fields.code),
        identifier: fields.identifier,
        title: fields.title,
        summary: fields.summary,
      };
    });
}

/**
 * Attach the generated constant name to each entry.
 *
 * Fails rather than emitting a duplicate or unusable declaration on: a
 * duplicate `identifier`, two identifiers colliding on one PascalCase name, or
 * a name that isn't a valid JavaScript identifier. None of the three occurs in
 * the registry today; the assertions are here to keep it that way.
 *
 * @param {Array<object>} entries - Entries from `loadEntries`.
 * @returns {Array<object>} The same entries, each with a `name` property.
 */
function nameEntries(entries) {
  const byIdentifier = new Map();
  const byName = new Map();

  return entries.map((entry) => {
    const { code, identifier } = entry;

    if (byIdentifier.has(identifier)) {
      throw new GeneratorError(`duplicate identifier "${identifier}": used by both ${byIdentifier.get(identifier)} and ${code}`);
    }
    byIdentifier.set(identifier, code);

    const name = pascalCase(identifier);
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
      throw new GeneratorError(`identifier "${identifier}" (${code}) generates "${name}", which is not a valid JavaScript identifier`);
    }
    if (byName.has(name)) {
      const other = byName.get(name);
      throw new GeneratorError(`identifier "${identifier}" (${code}) collides with "${other.identifier}" (${other.code}): both generate "${name}"`);
    }
    byName.set(name, entry);

    return { ...entry, name };
  });
}

/**
 * Hard-wrap prose to the JSDoc content width.
 *
 * @param {string} text - The text to wrap.
 * @returns {Array<string>} One string per output line.
 */
function wrap(text) {
  const lines = [];
  let line = '';
  text.split(/\s+/).filter(Boolean).forEach((word) => {
    if (line === '') {
      line = word;
    } else if (`${line} ${word}`.length <= DOC_WIDTH) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line !== '') lines.push(line);
  return lines;
}

/**
 * Neutralise anything in registry prose that would close a JSDoc comment.
 *
 * @param {string} text - The text to escape.
 * @returns {string} The text, safe to embed in a block comment.
 */
function escapeDoc(text) {
  return text.replace(/\*\//g, '*\\/');
}

/**
 * Render the JSDoc block documenting one code.
 *
 * @param {object} entry - A named entry.
 * @returns {string} The comment block, without a trailing newline.
 */
function docBlock(entry) {
  const title = escapeDoc(entry.title).replace(/\.$/, '');
  return [
    '/**',
    ` * ${title}.`,
    ' *',
    ...wrap(escapeDoc(entry.summary)).map((l) => ` * ${l}`),
    ` * @see https://help.ably.io/error/${entry.code}`,
    ' */',
  ].join('\n');
}

/**
 * Render the `--format=type` output: the union of numeric literals alone.
 *
 * @param {Array<object>} entries - Named entries in output order.
 * @returns {string} The file contents.
 */
function renderType(entries) {
  return [
    ...HEADER,
    '',
    '/** A registered Ably error code. */',
    'export type ErrorCode =',
    ...entries.map((e, i) => `  | ${e.code}${i === entries.length - 1 ? ';' : ''}`),
    '',
  ].join('\n');
}

/**
 * Render the `--format=const` output: one const per code, then the union.
 *
 * @param {Array<object>} entries - Named entries in output order.
 * @returns {string} The file contents.
 */
function renderConst(entries) {
  return [
    ...HEADER,
    '',
    ...entries.flatMap((e) => [docBlock(e), `export const ${e.name} = ${e.code};`, '']),
    '/** A registered Ably error code. */',
    'export type ErrorCode =',
    ...entries.map((e, i) => `  | typeof ${e.name}${i === entries.length - 1 ? ';' : ''}`),
    '',
  ].join('\n');
}

/**
 * Generate the TypeScript source for a set of registry entries.
 *
 * @param {string} format - Either `type` or `const`.
 * @param {Array<object>} [entries] - Entries to render; defaults to the registry.
 * @returns {string} The file contents.
 */
function generate(format, entries = loadEntries()) {
  if (!FORMATS.includes(format)) {
    throw new GeneratorError(`unknown --format "${format}" (expected ${FORMATS.join(' or ')})`);
  }
  const named = nameEntries(entries);
  if (named.length === 0) {
    throw new GeneratorError('the registry is empty: nothing to generate');
  }
  return format === 'type' ? renderType(named) : renderConst(named);
}

/**
 * Parse `--format` and `--out` from the command line.
 *
 * @param {Array<string>} argv - Arguments after the script name.
 * @returns {{ format: string, out: string | null }} The parsed options; `out`
 *   is null when the output goes to stdout.
 */
function parseArgs(argv) {
  let format = null;
  let out = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const flag = arg.replace(/=.*$/, '');
    let value = arg.includes('=') ? arg.slice(arg.indexOf('=') + 1) : null;
    if (value === null && (flag === '--format' || flag === '--out')) {
      i += 1;
      value = i < argv.length ? argv[i] : null;
      if (value === null) throw new GeneratorError(`${flag} requires a value\n${USAGE}`);
    }
    if (flag === '--format') {
      format = value;
    } else if (flag === '--out') {
      out = value;
    } else {
      throw new GeneratorError(`unexpected argument "${arg}"\n${USAGE}`);
    }
  }

  if (!format) throw new GeneratorError(`--format is required\n${USAGE}`);
  return { format, out: out === '-' ? null : out };
}

/**
 * Run as a CLI: generate and write to `--out`, or to stdout if it is omitted.
 *
 * @returns {void}
 */
function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const source = generate(opts.format);
    if (opts.out === null) {
      process.stdout.write(source);
      return;
    }
    const target = path.resolve(process.cwd(), opts.out);
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, source);
    } catch (err) {
      throw new GeneratorError(`could not write ${target}: ${err.message}`);
    }
    const shown = path.relative(process.cwd(), target);
    console.error(`Wrote ${shown.startsWith('..') ? target : shown}`);
  } catch (err) {
    // A bad argument or an unusable registry is the caller's problem, so report
    // it as a message. A stack here would only ever be noise. Anything else is
    // a bug in the generator, and rethrowing keeps the stack that locates it.
    if (!(err instanceof GeneratorError)) throw err;
    console.error(err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  pascalCase, loadEntries, nameEntries, generate,
};
