const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const yamlSource = fs.readFileSync(path.resolve(__dirname, 'sdk.yaml')).toString();
const parserOptions = {
  mapAsMap: true,
};
const object = YAML.parse(yamlSource, parserOptions);

emit(0, object);

function emit(level, node) {
  if (level > 10) {
    throw new Error(`Arbitrary depth limit exceeded.`);
  }

  const indent = ' '.repeat(2).repeat(level);
  if (node instanceof Map) {
    node.forEach((value, key) => {
      console.log(`${indent}${key}:`);
      emit(level + 1, value);
    });
  } else if (Array.isArray(node)) {
    node.forEach((element) => {
      emit(level, element);
    });
  } else if (node instanceof String || typeof node === 'string') {
    console.log(`${indent}"${node}"`);
  } else if (node === null) {
    // the value for a key with no value defined
  } else {
    console.log(`${indent}${typeof node} = ${node}`);
  }
}
