const {
  isPropertyKey,
  Properties,
} = require('./sdk-node-properties');

const COMPLIANCE_KEY = 'compliance';
const VARIANTS_KEY = 'variants';

class Manifest {
  constructor(manifest, canonicalFeatures) {
    if (!(manifest instanceof Map)) {
      throw new Error('manifest should be a Map.');
    }
    if (!(manifest.get(COMPLIANCE_KEY) instanceof Map)) {
      throw new Error('manifest compliance should be a Map.');
    }
    assertFeatures(canonicalFeatures, [], manifest.get(COMPLIANCE_KEY));
    this.manifest = manifest;
  }

  /**
   * Locate a node indicating compliance with a particular feature.
   *
   * @param {string[]} featurePath The feature node names, from root, forming a path to the feature.
   * @returns {Map} The feature node.
   */
  find(featurePath) {
    let node = this.manifest.get(COMPLIANCE_KEY);
    featurePath.forEach((featurePathComponent) => {
      if (node) {
        node = node.get(featurePathComponent);
        if (node && !(node instanceof Map)) {
          throw new Error(`manifest node with key '${featurePathComponent}' should be a Map but it is of type '${typeof node}'.`);
        }
      }
    });
    if (!node) {
      return null; // not found
    }
    return new Properties(node);
  }

  /**
   * Check whether a variants node property includes all canonically listed variants for this manifest.
   *
   * @param {string[]} variants The list of variants supported for a particular feature.
   * @returns {boolean} `true` if only a subset of the canonically listed variants are included.
   * @throws If the given variants list is of wrong type or empty, or there is no canonical list to refer to.
   */
  isPartialVariantsCoverage(variants) {
    if (!Array.isArray(variants)) {
      throw new Error('Expected an array (of strings).');
    }
    if (variants.length < 1) {
      throw new Error('Expected a non-empty array (of strings).');
    }
    const canonicalVariants = this.manifest.get(VARIANTS_KEY);
    if (!canonicalVariants || canonicalVariants.length < 1) {
      throw new Error('There is not a non-empty list of canonical variants to refer to.');
    }

    let isPartial = false;
    canonicalVariants.forEach((variant) => {
      if (!variants.includes(variant)) {
        isPartial = true;
      }
    });

    return isPartial;
  }
}

/**
 * Validates that all feature nodes in the manifest are listed in the canonical tree.
 *
 * @param {Map} canonicalNode The node in the canonical tree to inspect.
 * @param {string[]} path The path to this node, mainly for debugging errors but also to cap recursion depth.
 * @param {Map} manifestNode The node in the manifest to inspect.
 * @throws If nodes aren't maps or if validation fails.
 */
function assertFeatures(canonicalNode, path, manifestNode) {
  if (path.length > 10) {
    throw new Error('Depth has exceeded arbitrary limit.');
  }
  if (!(manifestNode instanceof Map)) {
    throw new Error(`Manifest node is not a Map at path "${path}". Type is "${typeof manifestNode}", Stringified Value is "${manifestNode}".`);
  }
  if (!(canonicalNode instanceof Map) && canonicalNode !== null) {
    throw new Error(`Canonical node is not a Map, or null, at path "${path}". Type is "${typeof canonicalNode}", Stringified Value is "${canonicalNode}".`);
  }

  manifestNode.forEach((value, key) => {
    if (!isPropertyKey(key)) {
      const fullPath = [...path, key];
      if (!(canonicalNode instanceof Map)) {
        throw new Error(`Canonical node is not a Map at path "${path}". Type is "${typeof canonicalNode}", Stringified Value is "${canonicalNode}".`);
      }
      const canonicalValue = canonicalNode.get(key);
      if (canonicalValue === undefined) {
        throw new Error(`Canonical node not found for manifest node at path "${fullPath}".`);
      }

      // value will be null here where the key in the YAML document doesn't have an explicit value,
      // typically a Map, Array or string. e.g. in the case of nullValue here:
      //
      // %YAML 1.2
      // ---
      // arrayValue:
      //   - arrayElement
      // nullValue:
      // mapValue:
      //   mapKey: mapValue
      // stringValue: Hello World

      if (value !== null) {
        assertFeatures(canonicalValue, fullPath, value);
      }
    }
  });
}

module.exports = {
  Manifest,
};
