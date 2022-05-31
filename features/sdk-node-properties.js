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
    return `<a href="${url}" target="_blank" rel="noopener"><code>${escape(this.value)}</code></a>`;
  }
}

const smithyShapeIdentifiers = createMapOfSmithyShapeIdentifiers();

/**
 * Creates a map of Smithy shape identifiers.
 *
 * @returns {Map} Smithy shape identifiers and the regular expressions to be used to qualify
 * that strings match them, where entry keys are Smithy shape identifiers as a `string` and the
 * values are `RegExp` instances.
 * @see https://awslabs.github.io/smithy/1.0/spec/core/model.html#shape-id
 */
function createMapOfSmithyShapeIdentifiers() {
  const identifierStart = '(_*[A-Za-z])';
  const identifierChars = '[A-Za-z\\d_]';
  const identifier = `(${identifierStart}${identifierChars}*)`;
  const namespace = `(${identifier}+(\\.${identifier})*)`;
  return new Map([
    ['shape_id_member', new RegExp(`^\\$${identifier}$`)],
    ['absolute_root_shape_id', new RegExp(`^${namespace}#${identifier}$`)],

    // Our 'shape_id' is intentionally less inclusive than that defined in
    // Smithy's version 1.0 Shape ID ABNF. We have ignored the intermediate
    // 'root_shape_id', ignoring the fact that it can be either an
    // 'absolute_root_shape_id' or an 'identifier', insisting that we expect
    // to see a namespace. We can always consider opening this up in future
    // if we find that some SDK manifests need to have identifiers at root
    // which don't have a namespace component.
    ['shape_id', new RegExp(`^${namespace}#${identifier}\\$${identifier}$`)],
  ]);
}

/**
 * Look up and return the Smithy identifier matching the form of the given value.
 *
 * @param {string} value The value to be inspected and matched to a shape identifier.
 * @returns {string} The shape idenfier that matches the value.
 * @throws When a shape identifier could not be matched to the value.
 */
function matchSmithyShapeIdentifier(value) {
  let found = false;
  smithyShapeIdentifiers.forEach((regExp, shapeIdentifier) => {
    if (value.match(regExp)) {
      found = shapeIdentifier;
    }
  });
  if (!found) {
    throw new Error(`Smithy shape identifier form not found for value "${value}".`);
  }
  return found;
}

const CONSTRUCTOR_KEY = 'constructor';
const IDENTIFIER_KEY = 'identifier';
const ARGUMENTS_KEY = 'arguments';
const IDENTITY_TRANSFORM = (value) => value;

class ApiDefinition {
  constructor(value) {
    if (value instanceof String || typeof value === 'string') {
      // shorter form of the longer form (a single IDENTIFIER_KEY)
      this.shapeIdentifier = matchSmithyShapeIdentifier(value);
      return; // Success constructing from a value of type string
    }

    if (value instanceof Map) {
      if (value.size < 1) {
        throw new Error('Expected a map with at least one entry.');
      }
      const conformedKeySet = Array.from(value.keys()).sort().join(',');
      switch (conformedKeySet) {
        case CONSTRUCTOR_KEY:
          // TODO work on the naming here, as 'constructor' is not a concept in the Smithy model.
          this.shapeIdentifier = 'constructor';
          this.arguments = transformStrings(value.get(CONSTRUCTOR_KEY), IDENTITY_TRANSFORM);
          break;

        case `${ARGUMENTS_KEY},${IDENTIFIER_KEY}`:
          this.arguments = transformStrings(value.get(ARGUMENTS_KEY), IDENTITY_TRANSFORM);
        // eslint-disable-next-line no-fallthrough
        case IDENTIFIER_KEY:
          this.shapeIdentifier = matchSmithyShapeIdentifier(value.get(IDENTIFIER_KEY));
          break;

        default:
          throw new Error(`Conformed key set pattern "${conformedKeySet}" not recognised.`);
      }
      return; // Success constructing from a node of type Map
    }

    throw new Error(`node of type ${typeof value} could not be handled.`);
  }
}

class Notes {
  constructor(value) {
    if (!(value instanceof Map)) {
      throw new Error('Expected a Map.');
    }

    this.partial = transformString(value.get('partial'), IDENTITY_TRANSFORM);
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
            // used in the canonical features list
            this.documentationUrls = transformStrings(value, (stringValue) => new URL(stringValue));
            break;

          case 'specification':
            // used in the canonical features list
            this.specificationPoints = transformStrings(value, (stringValue) => new SpecificationPoint(stringValue));
            break;

          case 'synopsis':
            // used in the canonical features list
            this.synopsis = transformString(value, IDENTITY_TRANSFORM);
            break;

          case 'api':
            // used in the SDK manifests
            this.apiDefinitions = parseApiDefinitions(value);
            break;

          case 'variants':
            // used in the SDK manifests
            this.variants = transformStrings(value, IDENTITY_TRANSFORM);
            break;

          case 'notes':
            // used in the SDK manifests
            this.notes = new Notes(value);
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

/**
 * Returns an array of one or more ApiDefinition instances, as extracted from the given value.
 *
 * @param {*} value The value from an `.api` key in a manifest Map.
 * @returns {*[]} The ApiDefinition instances. Will never be empty.
 * @throws If value type not accept, no values to parse (if array) or cannot be mapped
 * to a Smithy shape identifier.
 */
function parseApiDefinitions(value) {
  if (Array.isArray(value)) {
    if (value.length < 1) {
      throw new Error('No values to parse.');
    }
    return value.map((element) => new ApiDefinition(element));
  }

  // assumed to be a string or Map, both understood by the ApiDefinition constructor
  return [new ApiDefinition(value)];
}
