const fs = require('fs');
const path = require('path');
const { Validator } = require('jsonschema');

const schemaPath = path.resolve(__dirname, '..', 'test-resources', 'agents-schema.json');
const agentsPath = path.resolve(__dirname, '..', 'protocol', 'agents.json');
const schema = require(schemaPath);
const agents = require(agentsPath);

const jsonschema = new Validator();
jsonschema.addSchema(
    schema,
    'https://schemas.ably.com/json/asset-common/Agents'
);

describe("agents.json", () => {
    it("matches the jsonschema", () => {
        const { errors } = jsonschema.validate(agents, schema);
        expect(errors.length).toBe(0);
    });
});
