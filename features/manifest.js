const { Properties } = require('./sdk-node-properties');

const COMPLIANCE_KEY = 'compliance';

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
}

module.exports = {
  Manifest,
};
