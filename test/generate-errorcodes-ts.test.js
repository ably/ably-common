const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  pascalCase, loadEntries, nameEntries, generate,
} = require('../errors/scripts/generate-errorcodes-ts');

const SCRIPT = path.resolve(__dirname, '..', 'errors', 'scripts', 'generate-errorcodes-ts.js');

/**
 * Run the generator as a CLI, the way a consuming repository does.
 *
 * @param {...string} argv - Arguments to pass.
 * @returns {{ status: number, stdout: string, stderr: string }} The result.
 */
const run = (...argv) => spawnSync(process.execPath, [SCRIPT, ...argv], { encoding: 'utf8' });

/**
 * Build a registry entry, overriding any field.
 *
 * @param {object} [overrides] - Fields to override on the default entry.
 * @returns {object} An entry as `loadEntries` would return it.
 */
const entry = (overrides = {}) => ({
  code: 40000,
  identifier: 'bad_request',
  title: 'Bad request',
  summary: 'The request was rejected because it was invalid and could not be processed.',
  ...overrides,
});

/**
 * Write a throwaway `codes/` directory containing the given entries.
 *
 * @param {Array<object>} entries - Entries to write, one file each.
 * @param {object} [options] - Options.
 * @param {string} [options.eol] - The line ending to write with; defaults to LF.
 * @param {string} [options.dir] - Where to write; defaults to a fresh temp dir.
 * @returns {string} The directory path.
 */
function writeRegistry(entries, options = {}) {
  const { eol = '\n' } = options;
  const dir = options.dir || fs.mkdtempSync(path.join(os.tmpdir(), 'ably-codes-'));
  entries.forEach((e) => {
    const fields = ['code', 'identifier', 'title', 'summary']
      .filter((k) => e[k] !== undefined)
      .map((k) => `${k}: ${e[k]}`);
    fs.writeFileSync(path.join(dir, `${e.code}.md`), ['---', ...fields, '---', ''].join(eol));
  });
  return dir;
}

describe('pascalCase', () => {
  it('converts snake_case identifiers', () => {
    expect(pascalCase('bad_request')).toBe('BadRequest');
    expect(pascalCase('room_is_in_an_invalid_state')).toBe('RoomIsInAnInvalidState');
    expect(pascalCase('unable_to_automatically_re_enter_presence'))
      .toBe('UnableToAutomaticallyReEnterPresence');
  });

  it('keeps single-word and digit-bearing identifiers intact', () => {
    expect(pascalCase('disconnected')).toBe('Disconnected');
    expect(pascalCase('http2_error')).toBe('Http2Error');
  });
});

describe('loadEntries', () => {
  it('orders entries by numeric code, not lexically', () => {
    const dir = writeRegistry([
      entry({ code: 102202, identifier: 'c' }),
      entry({ code: 9999, identifier: 'a' }),
      entry({ code: 40000, identifier: 'b' }),
    ]);
    expect(loadEntries(dir).map((e) => e.code)).toEqual([9999, 40000, 102202]);
  });

  it('rejects an entry missing a required field', () => {
    const dir = writeRegistry([entry({ summary: undefined })]);
    expect(() => loadEntries(dir)).toThrow(/40000\.md: missing frontmatter field\(s\): summary/);
  });

  it('names the file it could not read', () => {
    const dir = writeRegistry([]);
    fs.mkdirSync(path.join(dir, '40000.md'));
    expect(() => loadEntries(dir)).toThrow(/could not read 40000\.md/);
  });

  it('explains an absent registry rather than surfacing a bare ENOENT', () => {
    const dir = path.join(os.tmpdir(), 'ably-codes-does-not-exist');
    expect(() => loadEntries(dir)).toThrow(/no error registry at .*submodule may be uninitialised/s);
  });

  it('reads a registry written with CRLF line endings', () => {
    // A Windows checkout lands every `.md` with CRLF endings, which used to
    // fail the frontmatter fence check on all of them. See
    // test/frontmatter.test.js for the parser-level cases.
    const dir = writeRegistry([entry(), entry({ code: 40001, identifier: 'x' })], { eol: '\r\n' });
    expect(loadEntries(dir)).toEqual([
      entry(),
      entry({ code: 40001, identifier: 'x' }),
    ]);
  });
});

describe('nameEntries', () => {
  it('attaches the generated name to each entry', () => {
    expect(nameEntries([entry()])[0].name).toBe('BadRequest');
  });

  it('fails on a duplicate identifier', () => {
    const entries = [entry({ code: 40000 }), entry({ code: 40001 })];
    expect(() => nameEntries(entries)).toThrow(/duplicate identifier "bad_request"/);
  });

  it('fails on a PascalCase collision between distinct identifiers', () => {
    const entries = [
      entry({ code: 40000, identifier: 'bad_request' }),
      entry({ code: 40001, identifier: 'bad__request' }),
    ];
    expect(() => nameEntries(entries)).toThrow(/collides with "bad_request".*both generate "BadRequest"/);
  });

  it('fails on a name that is not a valid JavaScript identifier', () => {
    const entries = [entry({ identifier: 'bad-request' })];
    expect(() => nameEntries(entries)).toThrow(/not a valid JavaScript identifier/);
  });
});

describe('generate', () => {
  it('rejects an unknown format', () => {
    expect(() => generate('enum', [entry()])).toThrow(/unknown --format "enum"/);
  });

  it('rejects an empty registry', () => {
    expect(() => generate('type', [])).toThrow(/registry is empty/);
  });

  it('emits a union of numeric literals for --format=type', () => {
    const out = generate('type', [entry({ code: 40000 }), entry({ code: 40001, identifier: 'x' })]);
    expect(out).toBe([
      '// GENERATED FROM ably-common/errors/codes — DO NOT EDIT.',
      '// Regenerate with: npm run generate:errorcodes-ts',
      '',
      '/** A registered Ably error code. */',
      'export type ErrorCode =',
      '  | 40000',
      '  | 40001;',
      '',
    ].join('\n'));
  });

  it('emits one documented const per code for --format=const', () => {
    expect(generate('const', [entry()])).toBe([
      '// GENERATED FROM ably-common/errors/codes — DO NOT EDIT.',
      '// Regenerate with: npm run generate:errorcodes-ts',
      '',
      '/**',
      ' * Bad request.',
      ' *',
      ' * The request was rejected because it was invalid and could not be processed.',
      ' * @see https://help.ably.io/error/40000',
      ' */',
      'export const BadRequest = 40000;',
      '',
      '/** A registered Ably error code. */',
      'export type ErrorCode =',
      '  | typeof BadRequest;',
      '',
    ].join('\n'));
  });

  it('emits individual consts rather than an object or a TS enum, so codes tree-shake', () => {
    const out = generate('const', [entry()]);
    expect(out).not.toMatch(/\benum\b/);
    expect(out).not.toMatch(/as const/);
  });

  it('wraps long summaries and escapes anything that would close the comment', () => {
    const out = generate('const', [entry({
      summary: `An overlong summary ${'padding '.repeat(12)}ends here with a */ sequence.`,
    })]);
    out.split('\n').forEach((line) => expect(line.length).toBeLessThanOrEqual(80));
    // The only `*/` in the doc block is its terminator: the one in the summary
    // was escaped, so the comment can't be closed early.
    const doc = out.slice(out.indexOf('/**'), out.indexOf('export const'));
    expect(doc).toContain('*\\/');
    expect(doc.match(/\*\//g)).toHaveLength(1);
  });

  it('wraps a long title, not just a long summary', () => {
    const title = `An overlong title ${'padding '.repeat(8)}ends here`;
    const out = generate('const', [entry({ title })]);
    out.split('\n').forEach((line) => expect(line.length).toBeLessThanOrEqual(80));

    const lines = out.split('\n');
    const titleLines = lines
      .slice(lines.indexOf('/**') + 1, lines.indexOf(' *'))
      .map((l) => l.replace(/^ \* /, ''));
    expect(titleLines.length).toBeGreaterThan(1);
    expect(titleLines.join(' ')).toBe(`${title}.`);
  });
});

describe('the CLI', () => {
  /**
   * Assert a run failed the way a CLI should: a message, no stack, exit 1.
   *
   * @param {object} result - A result from `run`.
   * @param {RegExp} expected - A pattern the message must match.
   * @returns {void}
   */
  const expectCleanFailure = (result, expected) => {
    expect(result.stderr).toMatch(expected);
    expect(result.stderr).not.toMatch(/^\s+at /m);
    expect(result.stderr).not.toContain('GeneratorError');
    expect(result.stdout).toBe('');
    expect(result.status).toBe(1);
  };

  it('writes to stdout when --out is omitted', () => {
    const result = run('--format=type');
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^export type ErrorCode =$/m);
  });

  it('reports an unknown format as a message, not a stack trace', () => {
    expectCleanFailure(run('--format=enum'), /unknown --format "enum"/);
  });

  it('reports an unusable registry as a message, not a stack trace', () => {
    // The script resolves the registry relative to itself, so the only way to
    // reach this from the command line is to stand a copy of it up over a
    // registry that is genuinely broken.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ably-gen-'));
    const scripts = path.join(root, 'errors', 'scripts');
    const codes = path.join(root, 'errors', 'codes');
    fs.mkdirSync(scripts, { recursive: true });
    fs.mkdirSync(codes, { recursive: true });
    ['generate-errorcodes-ts.js', 'frontmatter.js'].forEach((f) => fs.copyFileSync(
      path.resolve(__dirname, '..', 'errors', 'scripts', f),
      path.join(scripts, f),
    ));
    writeRegistry([entry({ code: 40000 }), entry({ code: 40001 })], { dir: codes });

    const result = spawnSync(
      process.execPath,
      [path.join(scripts, 'generate-errorcodes-ts.js'), '--format=type'],
      { encoding: 'utf8' },
    );
    expectCleanFailure(result, /duplicate identifier "bad_request"/);
  });

  it('reports a bad argument as a message, not a stack trace', () => {
    expectCleanFailure(run('--format=type', '--bogus'), /unexpected argument "--bogus"/);
    expectCleanFailure(run('--out=x.ts'), /--format is required/);
    expectCleanFailure(run('--format'), /--format requires a value/);
  });

  it('reports an unwritable --out as a message, not a stack trace', () => {
    const notADirectory = path.join(SCRIPT, 'nested', 'errorcodes.ts');
    expectCleanFailure(run('--format=type', '--out', notADirectory), /could not write .*errorcodes\.ts/);
  });
});

describe('the committed registry', () => {
  it('generates both formats without tripping an assertion', () => {
    expect(() => generate('type')).not.toThrow();
    expect(() => generate('const')).not.toThrow();
  });

  it('is byte-identical across runs', () => {
    expect(generate('type')).toBe(generate('type'));
    expect(generate('const')).toBe(generate('const'));
  });

  it('emits one declaration and one union member per registry file', () => {
    const count = fs.readdirSync(path.resolve(__dirname, '..', 'errors', 'codes'))
      .filter((f) => f.endsWith('.md')).length;
    const out = generate('const');
    expect(out.match(/^export const /gm)).toHaveLength(count);
    expect(out.match(/^ {2}\| typeof /gm)).toHaveLength(count);
    expect(generate('type').match(/^ {2}\| \d+/gm)).toHaveLength(count);
  });

  it('keeps every emitted line within the doc width', () => {
    generate('const').split('\n').forEach((line) => expect(line.length).toBeLessThanOrEqual(80));
  });
});
