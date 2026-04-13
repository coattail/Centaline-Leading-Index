const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const PROJECT_ROOT = resolve(__dirname, "..");
const INDEX_HTML = readFileSync(resolve(PROJECT_ROOT, "index.html"), "utf8");

test("index.html cache-busts the primary static assets", () => {
  const assetPatterns = [
    /href="style\.css\?v=[^"]+"/,
    /src="house-price-data\.js\?v=[^"]+"/,
    /src="app\.js\?v=[^"]+"/,
  ];

  for (const pattern of assetPatterns) {
    assert.match(INDEX_HTML, pattern);
  }
});
