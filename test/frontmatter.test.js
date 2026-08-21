const { parseFrontmatter } = require('../errors/scripts/frontmatter');

/**
 * Build one registry document, joined with the given line ending.
 *
 * Both endings are built here rather than read from disk, so these tests assert
 * the same thing on every platform however git checked the repository out.
 *
 * @param {string} eol - The line ending to join with.
 * @returns {string} The document.
 */
const doc = (eol) => [
  '---',
  'code: 40142',
  'identifier: token_expired',
  'title: Token expired',
  'summary: "Rejected: the token had expired."',
  '---',
  '',
  '## What you should do',
  '',
  'Usually nothing.',
  '',
].join(eol);

const FIELDS = {
  code: '40142',
  identifier: 'token_expired',
  title: 'Token expired',
  summary: 'Rejected: the token had expired.',
};

describe('parseFrontmatter', () => {
  it('parses a document with LF endings', () => {
    const parsed = parseFrontmatter(doc('\n'));
    expect(parsed.error).toBeUndefined();
    expect(parsed.fields).toEqual(FIELDS);
    expect(parsed.hasBody).toBe(true);
  });

  it('parses a document with CRLF endings identically', () => {
    // A Windows checkout with git's default core.autocrlf=true gives every
    // registry file CRLF endings. Before normalising, the opening fence check
    // rejected all of them and reported the registry as malformed.
    expect(parseFrontmatter(doc('\r\n'))).toEqual(parseFrontmatter(doc('\n')));
  });

  it('leaves no carriage return in a parsed value', () => {
    const { fields } = parseFrontmatter(doc('\r\n'));
    Object.values(fields).forEach((value) => expect(value).not.toMatch(/\r/));
  });

  it('reports a missing opening fence, whichever the line ending', () => {
    expect(parseFrontmatter('code: 40142\n').error).toMatch(/missing opening/);
    expect(parseFrontmatter('code: 40142\r\n').error).toMatch(/missing opening/);
  });

  it('reports a missing closing fence, whichever the line ending', () => {
    expect(parseFrontmatter('---\ncode: 40142\n').error).toMatch(/missing closing/);
    expect(parseFrontmatter('---\r\ncode: 40142\r\n').error).toMatch(/missing closing/);
  });

  it('reports no body when the document is frontmatter alone', () => {
    expect(parseFrontmatter('---\r\ncode: 40142\r\n---\r\n').hasBody).toBe(false);
  });
});
