const { Validator } = require('jsonschema');

const schema = require('../json-schemas/src/agents.json');
const agents = require('../protocol/agents.json');
const versions = require('../json-schemas/versions.json');

const jsonschema = new Validator();
jsonschema.addSchema(
  schema,
  `https://schemas.ably.com/json/agents-${versions.agents}.json`,
);

describe('agents.json', () => {
  it('matches the jsonschema', () => {
    const { errors } = jsonschema.validate(agents, schema);
    expect(errors.length).toBe(0);
  });
});
