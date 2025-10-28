#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Exports agents.json to CSV format for easy database import
 */

const agentsFilePath = path.join(__dirname, '..', 'protocol', 'agents.json');
const outputPath = path.join(__dirname, '..', 'data', 'agents', 'agents.csv');

// Load agents data
const agents = JSON.parse(fs.readFileSync(agentsFilePath, 'utf8'));

// CSV header
const csvHeader = 'identifier,versioned,type,source,product,name';

// Process agents
const csvRows = [csvHeader];

agents.agents.forEach((agent) => {
  // Extract fields, using empty string for missing optional fields
  const identifier = agent.identifier || '';
  const versioned = agent.versioned !== undefined ? agent.versioned : '';
  const type = agent.type || '';
  const source = agent.source || '';
  const product = agent.product || '';
  const name = agent.name || '';

  // Escape fields that might contain commas
  const escapeCsvField = (field) => {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Create CSV row
  const row = [
    escapeCsvField(identifier),
    escapeCsvField(versioned),
    escapeCsvField(type),
    escapeCsvField(source),
    escapeCsvField(product),
    escapeCsvField(name),
  ].join(',');

  csvRows.push(row);
});

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write CSV file
const csvContent = csvRows.join('\n');
fs.writeFileSync(outputPath, csvContent);

console.log(`✅ Exported ${agents.agents.length} agents to ${outputPath}`);

// Summary by type
const typeCounts = {};
agents.agents.forEach((agent) => {
  typeCounts[agent.type] = (typeCounts[agent.type] || 0) + 1;
});

console.log('\nSummary by type:');
Object.entries(typeCounts).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count} agents`);
});

// Count SDK/wrapper with source
const withSource = agents.agents.filter((a) => a.source).length;
console.log(`\nAgents with source URLs: ${withSource}`);

// Count by product
const productCounts = {};
agents.agents.forEach((agent) => {
  if (agent.product) {
    productCounts[agent.product] = (productCounts[agent.product] || 0) + 1;
  }
});

if (Object.keys(productCounts).length > 0) {
  console.log('\nSummary by product:');
  Object.entries(productCounts).forEach(([product, count]) => {
    console.log(`  - ${product}: ${count} agents`);
  });
}
