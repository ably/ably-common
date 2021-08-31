const fs = require('fs');
const path = require('path');
const { Validator } = require('jsonschema');

const schemaPath = path.resolve(__dirname, '..', 'json-schemas', 'src', 'agents.json');
const agentsPath = path.resolve(__dirname, '..', 'protocol', 'agents.json');
const versionsPath = path.resolve(__dirname, '..', 'json-schemas', 'versions.json');
const schema = require(schemaPath);
const agents = require(agentsPath);
const versions = require(versionsPath);

const jsonschema = new Validator();
jsonschema.addSchema(
    schema,
    `https://schemas.ably.com/json/agents-${versions['agents']}.json`
);

describe("agents.json", () => {
    it("matches the jsonschema", () => {
        const { errors } = jsonschema.validate(agents, schema);
        expect(errors.length).toBe(0);
    });
});
