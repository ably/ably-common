const escape = require('escape-html');

const isPropertyKey = (key) => key.startsWith('.');
const propertyKeyName = (key) => key.substring(1);

const specificationPointRegExp = /^[A-Z]{1,3}[1-9]\d*([a-z]((([1-9]\d*)?[a-z])?([1-9]\d*)?)?)?$/;

class SpecificationPoint {
  constructor(value) {
    if (!specificationPointRegExp.test(value)) {
      throw new Error(`Value '${value}' is not formatted like a specification point.`);
    }
    this.value = value;
  }

  toString() {
    return this.value;
  }

  toHtmlLink() {
    const url = `https://docs.ably.com/client-lib-development-guide/features/#${this.value}`;
    return `<a href="${url}" target="_blank" rel="noopener">${escape(this.value)}</a>`;
  }
}

class NodePointer {
  constructor(value) {
    this.keys = transformStrings(value, (stringValue) => stringValue);
  }

  toString() {
    return this.keys.join(': ');
  }
}

class Properties {
  constructor(node) {
    if (!(node instanceof Map)) {
      return; // nothing to be extracted
    }
    node.forEach((value, key) => {
      if (isPropertyKey(key)) {
        const name = propertyKeyName(key);
        switch (name) {
          case 'documentation':
            this.documentationUrls = transformStrings(value, (stringValue) => new URL(stringValue));
            break;

          case 'inherit':
            this.parentPointer = new NodePointer(value);
            break;

          case 'specification':
            this.specificationPoints = transformStrings(value, (stringValue) => new SpecificationPoint(stringValue));
            break;

          case 'synopsis':
            this.synopsis = transformString(value, (stringValue) => stringValue);
            break;

          default:
            throw new Error(`Property key '${name}' is not recognised.`);
        }
      }
    });
  }
}

module.exports = {
  isPropertyKey,
  NodePointer,
  Properties,
  SpecificationPoint,
};

/**
 * Callback transforming a string.
 *
 * @callback StringTransformer
 * @param {string} value The string to be transformed.
 * @returns {*} The result of transforming the string.
 */

/**
 * Creates a new array populated with the results of calling a provided function with one
 * or more string values.
 *
 * @param {string|string[]} value A single string, or an array of strings.
 * @param {StringTransformer} transformer A function to be called with each string.
 * @returns {*[]} The results of transforming the string(s).
 * @throws If no values were provided or some values were not strings.
 */
function transformStrings(value, transformer) {
  if (value == null) {
    throw new Error('The value may not be null or undefined.');
  }
  const array = Array.isArray(value) ? value : [value];
  if (array.length < 1) {
    throw new Error('No values to transform.');
  }
  return array.map((element) => transformString(element, transformer));
}

/**
 * Returns the result of calling a provided function with a string value.
 *
 * @param {string} value A single string.
 * @param {StringTransformer} transformer A function to be called with the string.
 * @returns {*} The result of transforming the string.
 * @throws If the value provided is not a string.
 */
function transformString(value, transformer) {
  if (value instanceof String || typeof value === 'string') {
    return transformer(value);
  }
  throw new Error(`Encountered '${typeof value}' (${value}) when expecting a string.`);
}
