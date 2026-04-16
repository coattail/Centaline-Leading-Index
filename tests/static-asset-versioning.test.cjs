const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const PROJECT_ROOT = resolve(__dirname, "..");
const INDEX_HTML = readFileSync(resolve(PROJECT_ROOT, "index.html"), "utf8");
const APP_JS = readFileSync(resolve(PROJECT_ROOT, "app.js"), "utf8");

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

test("app.js cache-busts runtime-loaded data assets", () => {
  assert.match(APP_JS, /const DATA_ASSET_VERSION = "[^"]+"/);
  assert.match(APP_JS, /scriptPath:\s*`house-price-data-nbs-70\.js\?v=\$\{DATA_ASSET_VERSION\}`/);
});
