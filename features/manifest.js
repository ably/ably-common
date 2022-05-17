const { Properties } = require('./sdk-node-properties');

const COMPLIANCE_KEY = 'compliance';
const VARIANTS_KEY = 'variants';

class Manifest {
  constructor(manifest) {
    if (!(manifest instanceof Map)) {
      throw new Error('manifest should be a Map.');
    }
    if (!(manifest.get(COMPLIANCE_KEY) instanceof Map)) {
      throw new Error('manifest compliance should be a Map.');
    }
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

module.exports = {
  Manifest,
};
