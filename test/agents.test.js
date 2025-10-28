/* eslint-disable global-require */

const { Validator } = require('jsonschema');
const path = require('path');
const fs = require('fs');

describe('agents.json', () => {
  it('has a $schema attribute', () => {
    const agents = require('../protocol/agents.json');
    expect(agents.$schema).toBeDefined();
    expect(typeof agents.$schema).toBe('string');
  });

  it('validates against its declared schema', () => {
    const agents = require('../protocol/agents.json');

    // Ensure $schema is present
    if (!agents.$schema) {
      throw new Error('agents.json must have a $schema property');
    }

    // Load the schema from the path specified in $schema
    const schemaPath = path.resolve(
      path.dirname(require.resolve('../protocol/agents.json')),
      agents.$schema,
    );

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    // Validate
    const validator = new Validator();
    const result = validator.validate(agents, schema);

    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});
