/**
 * Shared parser for the constrained YAML frontmatter used by `codes/<code>.md`.
 * Used by the validator and by both generators, so they cannot diverge in how
 * they read a file.
 */

/**
 * Parse the frontmatter: a `---` fence, then one `key: value` per line, then a
 * closing `---`. Values may contain colons (we split on the first `: ` only)
 * and may be wrapped in double quotes.
 *
 * CRLF is normalised first: the git default `core.autocrlf=true` on Windows
 * checks every file out with CRLF endings, which would otherwise fail the
 * opening fence check and report the whole registry as malformed.
 *
 * @param {string} rawContent - The full file contents.
 * @returns {{ fields: object, hasBody: boolean } | { error: string }} Parsed
 *   frontmatter fields and whether a body follows, or an error description.
 */
function parseFrontmatter(rawContent) {
  const content = rawContent.replace(/\r\n/g, '\n');
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

module.exports = { parseFrontmatter };
