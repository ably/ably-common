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

// First Parse: using YAML's mid-level API, rendering a graph of the YAML structure
validateStructure(YAML.parseDocument(yamlSource).contents);

// Second Parse: using YAML's simplest API, rendering pure JS entities representing our data model
const parserOptions = {
  mapAsMap: true,
};
const object = YAML.parse(yamlSource, parserOptions);

// First Pass: Measure depth.
const arbitraryMaximumDepth = 10;
const levelCount = generateTableRows(null, arbitraryMaximumDepth, 0, object);
console.log(`levelCount = ${levelCount}`);

// Create output directory in standard location within working directory.
// The expectation is that this tool is run from the root of the repository.
const outputDirectoryPath = path.join('output', 'features');
createDirectory(outputDirectoryPath);

const title = 'Ably';
const subTitle = 'SDK Features';
const documentWriter = new DocumentWriter(
  { title: `${subTitle} | ${title}` },
  fs.createWriteStream(path.join(outputDirectoryPath, 'index.html')),
);

documentWriter.document((contentWriter) => {
  contentWriter.h(1, `${title} ${subTitle}`);
  contentWriter.class('border-collapse');
  contentWriter.table((tableWriter) => {
    // Second Pass: Render rows.
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
    const sortedKeys = Array.from(node.keys()).sort(compareKeys);
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
          writer.class('border-slate-300 border-t-2 border-b-2 align-top');
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
            rowWriter.class('pr-3 whitespace-nowrap');
            rowWriter.cell((cellContentWriter) => {
              cellContentWriter.text(key);
            });

            // Specification Points
            rowWriter.class('border-l px-1');
            rowWriter.cell((cellContentWriter) => {
              cellContentWriter.write(specificationPoints
                ? specificationPoints
                  .map((element) => element.toHtmlLink())
                  .join(', ')
                : '&nbsp;');
            });

            // Documentation Links and Synopsis
            rowWriter.class('border-l px-1');
            rowWriter.cell((cellContentWriter) => {
              let empty = true;
              if (documentationUrls) {
                cellContentWriter.write(documentationUrls
                  .map((element) => `<a href="${element}" target="_blank" rel="noopener">docs</a>`)
                  .join(', '));
                empty = false;
              }
              if (synopsis) {
                cellContentWriter.write(marked.parse(synopsis));
                empty = false;
              }
              if (empty) {
                cellContentWriter.write('&nbsp;');
              }
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

/**
 * Inspects YAML AST to ensure source constraints are met (e.g. ordered keys).
 *
 * @param {*} astNode The YAML AST node.
 * @param {number} level The depth, for recursion depth protection.
 */
function validateStructure(astNode, level = 0) {
  if (astNode === null) {
    return;
  }
  if (level > 20) {
    throw new Error('Recursion depth exceeded arbitrary limit.');
  }

  const nodeType = astNode.type;
  switch (nodeType) {
    case 'MAP':
      validateMapItems(astNode.items, level + 1);
      break;

    case 'FLOW_SEQ':
    case 'SEQ':
      astNode.items.forEach((item) => {
        validateStructure(item, level + 1);
      });
      break;

    case 'PLAIN':
    case 'BLOCK_LITERAL':
      break;

    default:
      throw new Error(`Unhandled YAML AST node type "${nodeType}".`);
  }
}

/**
 * Inspects items of YAML AST map to ensure source constraints are met.
 *
 * @param {*[]} items The YAML AST 'MAP' node items.
 * @param {number} level The depth, for recursion depth protection.
 */
function validateMapItems(items, level) {
  let previousKeyValue;
  items.forEach((item) => {
    if (item.type !== 'PAIR') {
      throw new Error('Map items should be pairs.');
    }

    const { key, value } = item;
    if (key.type !== 'PLAIN') {
      throw new Error('Map keys must be plain scalars.');
    }
    const keyValue = key.value;

    if (previousKeyValue && compareKeys(keyValue, previousKeyValue) < 0) {
      throw new Error(`Keys not sorted ("${keyValue}" should not be after "${previousKeyValue}").`);
    }
    previousKeyValue = keyValue;

    validateStructure(value, level + 1);
  });
}

/**
 * Compares two string keys, using our preferred comparison method.
 *
 * This method uses `localCompare` with the `sensitivity` option set to 'base',
 * meaning that comparisons are case insensitive.
 *
 * @param {string} a The first string (a.k.a. `referenceStr`).
 * @param {string} b The second string (a.k.a. `compareString`).
 * @returns {number} A negative number if `a` occurs before `b`;
 * positive if the `a` occurs after `b`; 0 if they are equivalent.
 */
function compareKeys(a, b) {
  return a.localeCompare(b, 'en', { sensitivity: 'base' });
}
