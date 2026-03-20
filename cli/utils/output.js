const formatTable = require("../formatters/table.js");
const formatJson = require("../formatters/json.js");
const formatToon = require("../formatters/toon.js");
const formatCsv = require("../formatters/csv.js");

const formatters = { table: formatTable, json: formatJson, toon: formatToon, csv: formatCsv };

async function printResult(data, format) {
  const formatter = formatters[format || "table"];
  if (!formatter) throw new Error(`Unknown format "${format}". Valid: table, json, toon, csv`);
  const output = await Promise.resolve(formatter(data));
  console.log(output);
}

function printError(err) {
  const message = err.message || String(err);
  process.stderr.write(`Error: ${message}\n`);
  if (message.includes("Authentication failed") || message.includes("401")) {
    process.stderr.write('Hint: Run "cisco-ise config test" to verify your credentials.\n');
  }
  process.exitCode = 1;
}

function printDryRun(info) {
  process.stderr.write("DRY RUN — no changes made\n");
  process.stderr.write(`${info.method} ${info.url}\n`);
  if (info.body) process.stderr.write(JSON.stringify(info.body, null, 2) + "\n");
}

function cleanResources(resources) {
  if (!Array.isArray(resources)) return resources;
  return resources.map((r) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(r)) {
      if (key === "link") continue;
      cleaned[key] = value;
    }
    return cleaned;
  });
}

module.exports = { printResult, printError, printDryRun, cleanResources };
