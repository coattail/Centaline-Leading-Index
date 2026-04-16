const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");

const PROJECT_ROOT = resolve(__dirname, "..");
const APP_JS = readFileSync(resolve(PROJECT_ROOT, "app.js"), "utf8");

function extractFunctionSource(startToken, endToken) {
  const start = APP_JS.indexOf(startToken);
  const end = APP_JS.indexOf(endToken, start);
  assert.notEqual(start, -1, `Missing token: ${startToken}`);
  assert.notEqual(end, -1, `Missing token: ${endToken}`);
  return APP_JS.slice(start, end);
}

const helperSource = [
  extractFunctionSource(
    "function pointToSegmentDistanceSquared",
    "function findNearestVisibleSeriesNameByPixel",
  ),
  extractFunctionSource(
    "function findNearestVisibleSeriesNameByPixel",
    "function resolveYAxisRoundUnit",
  ),
  "this.findNearestVisibleSeriesNameByPixel = findNearestVisibleSeriesNameByPixel;",
].join("\n");

const helperContext = {};
vm.createContext(helperContext);
vm.runInContext(helperSource, helperContext, { timeout: 1000 });
const { findNearestVisibleSeriesNameByPixel } = helperContext;

test("findNearestVisibleSeriesNameByPixel picks the nearest visible line segment", () => {
  const rendered = [
    { name: "北京", normalized: [100, 110, 120] },
    { name: "上海", normalized: [100, 90, 80] },
  ];
  const axisMonths = ["2026-01", "2026-02", "2026-03"];
  const monthToX = new Map(axisMonths.map((month, index) => [month, index * 100]));
  const toPixelCoord = (month, value) => ({ x: monthToX.get(month), y: 220 - value });

  const picked = findNearestVisibleSeriesNameByPixel(
    rendered,
    new Set(),
    axisMonths,
    148,
    107,
    toPixelCoord,
    18,
  );

  assert.equal(picked, "北京");
});

test("findNearestVisibleSeriesNameByPixel ignores hidden series", () => {
  const rendered = [
    { name: "北京", normalized: [100, 110, 120] },
    { name: "上海", normalized: [100, 90, 80] },
  ];
  const axisMonths = ["2026-01", "2026-02", "2026-03"];
  const monthToX = new Map(axisMonths.map((month, index) => [month, index * 100]));
  const toPixelCoord = (month, value) => ({ x: monthToX.get(month), y: 220 - value });

  const picked = findNearestVisibleSeriesNameByPixel(
    rendered,
    new Set(["北京"]),
    axisMonths,
    148,
    107,
    toPixelCoord,
    18,
  );

  assert.equal(picked, null);
});
