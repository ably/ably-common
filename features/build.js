const fs = require('fs');
const { marked } = require('marked');
const path = require('path');
const YAML = require('yaml');
const {
  DocumentWriter,
  TableWriter,
} = require('./html');
const {
  isPropertyKey,
  Properties,
} = require('./sdk-node-properties');

const yamlSource = fs.readFileSync(path.resolve(__dirname, 'sdk.yaml')).toString();
const parserOptions = {
  mapAsMap: true,
};
const object = YAML.parse(yamlSource, parserOptions);

// First pass: Measure depth.
const arbitraryMaximumDepth = 10;
const levelCount = generateTableRows(null, arbitraryMaximumDepth, 0, object);
console.log(`levelCount = ${levelCount}`);

// Create output directory in standard location within working directory.
// The expectation is that this tool is run from the root of the repository.
const outputDirectoryPath = path.join('output', 'features');
createDirectory(outputDirectoryPath);

const title = 'SDK Features';
const documentWriter = new DocumentWriter(
  { title },
  fs.createWriteStream(path.join(outputDirectoryPath, 'index.html')),
);

documentWriter.document((contentWriter) => {
  contentWriter.h(1, title);
  contentWriter.table((tableWriter) => {
    // Second pass: Render rows.
    generateTableRows(tableWriter, levelCount, 0, object);
  });
});

/**
 * Inspect a node, and it's children, optionally rendering to table rows.
 *
 * @param {TableWriter} [writer] The HTML table writer to use, or `null` to use this function purely to measure depth.
 * @param {number} maximumLevel The maximum depth, previously measured or arbitrary.
 * @param {number} level The depth of this node. Root is 0.
 * @param {*} node The node.
 * @returns {number} The number of levels, including this node and its children.
 */
function generateTableRows(writer, maximumLevel, level, node) {
  if (level > maximumLevel) {
    throw new Error(`Maximum depth limit exceeded (${maximumLevel}).`);
  }

  const consoleIndent = ' '.repeat(2).repeat(level);
  let maximumDepth = 0;
  if (node instanceof Map) {
    const sortedKeys = Array.from(node.keys()).sort();
    sortedKeys.forEach((key) => {
      const value = node.get(key);
      if (!isPropertyKey(key)) {
        if (writer) {
          const {
            specificationPoints,
            documentationUrls,
            synopsis,
          } = new Properties(value);

          console.log(`${consoleIndent}${key}:`);
          writer.row((rowWriter) => {
            // Indent using empty cells
            for (let i = 1; i <= level; i += 1) {
              rowWriter.class('px-3');
              rowWriter.cell((cellContentWriter) => {
                cellContentWriter.write('&nbsp;');
              });
            }

            // Contents, with column spanning to fill remaining cells, after indentation
            const cellCount = maximumLevel - level;
            if (cellCount > 1) {
              rowWriter.columnSpan(cellCount);
            }
            rowWriter.class('px-1');
            rowWriter.cell((cellContentWriter) => {
              cellContentWriter.text(key);
            });

            // Specification Points
            rowWriter.cell((cellContentWriter) => {
              cellContentWriter.write(specificationPoints
                ? specificationPoints
                  .map((element) => element.toHtmlLink())
                  .join(', ')
                : '&nbsp;');
            });

            // Documentation Links
            rowWriter.cell((cellContentWriter) => {
              cellContentWriter.write(documentationUrls
                ? documentationUrls
                  .map((element) => `<a href="${element}" target="_blank" rel="noopener">docs</a>`)
                  .join(', ')
                : '&nbsp;');
            });

            // Synopsis
            rowWriter.cell((cellContentWriter) => {
              cellContentWriter.write(synopsis
                ? marked.parse(synopsis)
                : '&nbsp;');
            });
          });
        }

        const depth = generateTableRows(writer, maximumLevel, level + 1, value);
        maximumDepth = Math.max(maximumDepth, 1 + depth);
      }
    });
  } else if (Array.isArray(node)) {
    node.forEach((element) => {
      const depth = generateTableRows(writer, maximumLevel, level, element);
      maximumDepth = Math.max(maximumDepth, depth);
    });
  } else if (node instanceof String || typeof node === 'string') {
    if (writer) {
      console.log(`${consoleIndent}"${node}"`);
    }
    maximumDepth = 1;
  } else if (node === null) {
    // the value for a key with no value defined
  } else if (writer) {
    // informational only, while debugging
    console.log(`${consoleIndent}${typeof node} = ${node}`);
  }

  return maximumDepth;
}

/**
 * Creates a directory at the given path if it doesn't exist, recursively if necessary.
 *
 * @param {string} directoryPath The directory path. Can be relative to current working directory.
 */
function createDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}
