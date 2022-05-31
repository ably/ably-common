const escape = require('escape-html');
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
const { Manifest } = require('./manifest');

// from Google Fonts' Icons (originally called 'Close' and 'Done').
// https://fonts.google.com/icons
const crossSvg = '<svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M12.45 37.65 10.35 35.55 21.9 24 10.35 12.45 12.45 10.35 24 21.9 35.55 10.35 37.65 12.45 26.1 24 37.65 35.55 35.55 37.65 24 26.1Z"/></svg>';
const tickSvg = '<svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M18.9 35.7 7.7 24.5 9.85 22.35 18.9 31.4 38.1 12.2 40.25 14.35Z"/></svg>';
const partialSvg = '<svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M10.4 26.4Q9.4 26.4 8.7 25.7Q8 25 8 24Q8 23 8.7 22.3Q9.4 21.6 10.4 21.6Q11.4 21.6 12.1 22.3Q12.8 23 12.8 24Q12.8 25 12.1 25.7Q11.4 26.4 10.4 26.4ZM24 26.4Q23 26.4 22.3 25.7Q21.6 25 21.6 24Q21.6 23 22.3 22.3Q23 21.6 24 21.6Q25 21.6 25.7 22.3Q26.4 23 26.4 24Q26.4 25 25.7 25.7Q25 26.4 24 26.4ZM37.6 26.4Q36.6 26.4 35.9 25.7Q35.2 25 35.2 24Q35.2 23 35.9 22.3Q36.6 21.6 37.6 21.6Q38.6 21.6 39.3 22.3Q40 23 40 24Q40 25 39.3 25.7Q38.6 26.4 37.6 26.4Z"/></svg>';

const sdkManifestSuffixes = [
  'java',
];

// Load YAML sources up-front, both for the canonical features list and the SDK manifests.
const loadSource = (fileName) => fs.readFileSync(path.resolve(__dirname, fileName)).toString();
const yamlSource = loadSource('sdk.yaml');
const sdkManifestSources = new Map();
sdkManifestSuffixes.forEach((sdkManifestSuffix) => {
  sdkManifestSources.set(sdkManifestSuffix, loadSource(`sdk-manifests/ably-${sdkManifestSuffix}.yaml`));
});

// First Parse: using YAML's mid-level API, rendering a graph of the YAML structure,
// and then running some of our checks over that structure to check foundational requirements.
validateStructure(YAML.parseDocument(yamlSource).contents);
sdkManifestSources.forEach((sdkManifestSource) => {
  validateStructure(YAML.parseDocument(sdkManifestSource).contents);
});

// Second Parse: using YAML's simplest API, rendering pure JS entities representing our data model
const parserOptions = {
  mapAsMap: true,
};
const object = YAML.parse(yamlSource, parserOptions);
const sdkManifests = new Map();
sdkManifestSources.forEach((sdkManifestSource, sdkManifestSuffix) => {
  const manifest = new Manifest(YAML.parse(sdkManifestSource, parserOptions), object);
  sdkManifests.set(sdkManifestSuffix, manifest);
});

// First Pass: Measure depth.
const arbitraryMaximumDepth = 10;
const levelCount = generateTableRows(null, arbitraryMaximumDepth, [], object);
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

  // Our convention, for this table, is borders to the right and bottom of cells.
  // (only exception being the top row, where there's also a border to the top)
  contentWriter.class('border-separate zero-border-spacing');

  contentWriter.table((tableWriter) => {
    renderTableHeaderRow(tableWriter, levelCount);

    // Second Pass: Render rows.
    generateTableRows(tableWriter, levelCount, [], object);
  });
});

/**
 * Render column headings to a table row.
 *
 * @param {TableWriter} writer The HTML table writer to use.
 * @param {number} maximumLevel The maximum depth, previously measured.
 */
function renderTableHeaderRow(writer, maximumLevel) {
  writer.class('align-top sticky top-0 bg-blue-700 text-white font-bold');
  const commonCellStyle = 'pt-1 pb-2 border-y-4 border-white border-r-4 sticky top-0';
  writer.row((rowWriter) => {
    rowWriter.columnSpan(maximumLevel);
    rowWriter.class(`pr-1 text-center ${commonCellStyle}`);
    rowWriter.cell((cellContentWriter) => {
      cellContentWriter.text('Feature');
    });

    // Specification Points
    rowWriter.class(`px-1 ${commonCellStyle}`);
    rowWriter.cell((cellContentWriter) => {
      cellContentWriter.text('Specification');
    });

    // Conceptual Documentation Links and Synopsis
    rowWriter.class(`px-1 ${commonCellStyle}`);
    rowWriter.cell((cellContentWriter) => {
      cellContentWriter.text('Synopsis and Links to Conceptual Documentation');
    });

    // SDK columns
    // eslint-disable-next-line no-restricted-syntax
    for (const sdkManifestSuffix of sdkManifests.keys()) {
      rowWriter.class(`px-1 text-center ${commonCellStyle}`);
      rowWriter.cell((cellContentWriter) => {
        cellContentWriter.text(sdkManifestSuffix);
      });
    }
  });
}

/**
 * Inspect a node, and it's children, optionally rendering to table rows.
 *
 * @param {TableWriter} [writer] The HTML table writer to use, or `null` to use this function purely to measure depth.
 * @param {number} maximumLevel The maximum depth, previously measured or arbitrary.
 * @param {string[]} parentKeys Parent keys, also indicating the depth of this node. Nodes at root have an empty array.
 * @param {*} node The node.
 * @returns {number} The number of levels, including this node and its children.
 */
function generateTableRows(writer, maximumLevel, parentKeys, node) {
  const level = parentKeys.length;
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
          const verticalBordersStyle = 'border-slate-300 border-b-2';
          const commonCellStyle = `${verticalBordersStyle} border-r-2`;
          writer.class('align-middle tooltip-container');
          writer.row((rowWriter) => {
            // Indent using empty cells
            for (let i = 1; i <= level; i += 1) {
              rowWriter.class(`px-3 ${verticalBordersStyle}`);
              rowWriter.cell((cellContentWriter) => {
                cellContentWriter.write('&nbsp;');
              });
            }

            // Contents, with column spanning to fill remaining cells, after indentation
            const cellCount = maximumLevel - level;
            if (cellCount > 1) {
              rowWriter.columnSpan(cellCount);
            }
            rowWriter.class(`pr-3 whitespace-nowrap ${commonCellStyle}`);
            rowWriter.cell((cellContentWriter) => {
              if (level > 0) {
                const tip = `<strong>${escape(parentKeys.join(': '))}</strong>: ${escape(key)}`;
                cellContentWriter.write(`<span class="tooltip-contents">${tip}</span>`);
              }
              cellContentWriter.text(key);
            });

            // Specification Points
            rowWriter.class(`px-1 ${commonCellStyle}`);
            rowWriter.cell((cellContentWriter) => {
              cellContentWriter.write(specificationPoints
                ? specificationPoints
                  .map((element) => element.toHtmlLink())
                  .join(', ')
                : '&nbsp;');
            });

            // Conceptual Documentation Links and Synopsis
            rowWriter.class(`px-1 ${commonCellStyle}`);
            rowWriter.cell((cellContentWriter) => {
              let empty = true;
              if (documentationUrls) {
                cellContentWriter.write(documentationUrls
                  .map((element) => `<a class="btn btn-blue" href="${element}" target="_blank" rel="noopener">docs</a>`)
                  .join(' '));
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

            // SDK columns
            sdkManifests.forEach((manifest) => {
              const compliance = manifest.find([...parentKeys, key]);

              let colourClass = 'bg-red-400';
              let svg = crossSvg;
              if (compliance) {
                const { variants, notes } = compliance;
                const hasPartialSupportForVariants = variants && manifest.isPartialVariantsCoverage(variants);
                const hasPartialSupportNotes = !!notes;
                if (hasPartialSupportForVariants || hasPartialSupportNotes) {
                  colourClass = 'bg-amber-400';
                  svg = partialSvg;
                } else {
                  colourClass = 'bg-green-400';
                  svg = tickSvg;
                }
              }

              rowWriter.class(`px-1 ${colourClass} ${commonCellStyle}`);
              rowWriter.cell((cellContentWriter) => {
                cellContentWriter.write(svg);
              });
            });
          });
        }

        const depth = generateTableRows(writer, maximumLevel, [...parentKeys, key], value);
        maximumDepth = Math.max(maximumDepth, 1 + depth);
      }
    });
  } else if (Array.isArray(node)) {
    node.forEach((element) => {
      const depth = generateTableRows(writer, maximumLevel, parentKeys, element);
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
