#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Validates a JSON file against a JSON Schema
 * Usage: node validate-json-schema.js <json-file> [schema-file-or-url]
 */

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log('Usage: validate-json-schema.js <json-file> [schema-file-or-url]');
  console.log();
  console.log('Arguments:');
  console.log('  json-file           Path to the JSON file to validate');
  console.log('  schema-file-or-url  Optional path or URL to the JSON schema');
  console.log('                      If not provided, will use $schema from the JSON file');
  console.log();
  console.log('Examples:');
  console.log('  validate-json-schema.js data.json');
  console.log('  validate-json-schema.js data.json schema.json');
  console.log('  validate-json-schema.js data.json https://example.com/schema.json');
  process.exit(0);
}

const jsonFilePath = args[0];
const schemaPathOrUrl = args[1];

// Load JSON file
let jsonData;
try {
  const absolutePath = path.resolve(jsonFilePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Error: JSON file not found: ${jsonFilePath}`);
    process.exit(1);
  }
  const jsonContent = fs.readFileSync(absolutePath, 'utf8');
  jsonData = JSON.parse(jsonContent);
} catch (error) {
  console.error(`❌ Error loading JSON file: ${error.message}`);
  process.exit(1);
}

// Determine schema location
let schemaLocation = schemaPathOrUrl;
if (!schemaLocation) {
  if (!jsonData.$schema) {
    console.error('❌ Error: No schema provided and JSON file does not contain $schema property');
    console.error('   Please provide a schema path/URL as the second argument');
    process.exit(1);
  }
  schemaLocation = jsonData.$schema;
  console.log(`📋 Using schema from $schema property: ${schemaLocation}`);
}

/**
 * Load schema from file path or URL
 *
 * @param {string} location - The schema location (file path or URL)
 * @returns {Promise<object>} The loaded schema object
 */
async function loadSchema(location) {
  // Check if it's a URL
  if (location.startsWith('http://') || location.startsWith('https://')) {
    return new Promise((resolve, reject) => {
      const client = location.startsWith('https://') ? https : http;
      client.get(location, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse schema from URL: ${e.message}`));
          }
        });
      }).on('error', reject);
    });
  }
  // It's a file path
  let schemaPath;
  if (path.isAbsolute(location)) {
    schemaPath = location;
  } else if (location === schemaPathOrUrl) {
    // Schema was provided as argument - resolve relative to current directory
    schemaPath = path.resolve(location);
  } else {
    // Schema came from $schema property - resolve relative to JSON file
    schemaPath = path.resolve(path.dirname(path.resolve(jsonFilePath)), location);
  }

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

/**
 * Validate data against schema using jsonschema library or basic validation
 *
 * @param {object} data - The data to validate
 * @param {object} schema - The JSON schema
 * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
 */
async function validateWithLibrary(data, schema) {
  try {
    // Try to load jsonschema library
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const { Validator } = require('jsonschema');
    const validator = new Validator();

    const result = validator.validate(data, schema);

    if (result.valid) {
      return { valid: true, errors: [] };
    }
    return {
      valid: false,
      errors: result.errors.map((err) => {
        const pathPrefix = err.property ? `${err.property}: ` : '';
        return `${pathPrefix}${err.message}`;
      }),
    };
  } catch (e) {
    // jsonschema library not available, fall back to basic validation
    return basicValidation(data, schema);
  }
}

/**
 * Basic validation without external libraries
 *
 * @param {object} data - The data to validate
 * @param {object} schema - The JSON schema
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
function basicValidation(data, schema) {
  const errors = [];

  // Check required properties
  if (schema.required && Array.isArray(schema.required)) {
    schema.required.forEach((prop) => {
      if (!(prop in data)) {
        errors.push(`Missing required property: ${prop}`);
      }
    });
  }

  // Check for additional properties if not allowed
  if (schema.additionalProperties === false && schema.properties) {
    const allowedProps = Object.keys(schema.properties);
    const dataProps = Object.keys(data);
    dataProps.forEach((prop) => {
      if (!allowedProps.includes(prop)) {
        errors.push(`Unexpected property: ${prop}`);
      }
    });
  }

  // Check property types
  if (schema.properties && typeof data === 'object' && data !== null) {
    Object.entries(schema.properties).forEach(([prop, propSchema]) => {
      if (prop in data) {
        const value = data[prop];
        if (propSchema.type) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (propSchema.type !== actualType) {
            errors.push(`Property '${prop}' should be ${propSchema.type} but is ${actualType}`);
          }
        }

        // Check enum values
        if (propSchema.enum && !propSchema.enum.includes(value)) {
          errors.push(`Property '${prop}' value '${value}' is not in allowed values: ${propSchema.enum.join(', ')}`);
        }

        // Check pattern
        if (propSchema.pattern && typeof value === 'string') {
          const regex = new RegExp(propSchema.pattern);
          if (!regex.test(value)) {
            errors.push(`Property '${prop}' value '${value}' does not match pattern: ${propSchema.pattern}`);
          }
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Main execution
(async () => {
  try {
    const schema = await loadSchema(schemaLocation);
    console.log('✅ Schema loaded successfully');

    const result = await validateWithLibrary(jsonData, schema);

    if (result.valid) {
      console.log(`✅ Validation successful! ${jsonFilePath} is valid according to the schema.`);

      // Print basic statistics about the data
      const stats = [];

      // Count arrays
      Object.entries(jsonData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          stats.push(`${value.length} ${key}`);
        } else if (typeof value === 'object' && value !== null) {
          const count = Object.keys(value).length;
          if (count > 0) {
            stats.push(`${count} ${key} entries`);
          }
        }
      });

      if (stats.length > 0) {
        console.log('   Summary:');
        stats.forEach((stat) => console.log(`   - ${stat}`));
      }

      process.exit(0);
    }
    console.log(`❌ Validation failed with ${result.errors.length} error(s):`);
    result.errors.forEach((err) => console.log(`   - ${err}`));
    process.exit(1);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
})();
