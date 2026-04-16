const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const PROJECT_ROOT = resolve(__dirname, "..");
const APP_JS = readFileSync(resolve(PROJECT_ROOT, "app.js"), "utf8");

test("grid clicks toggle hidden city state through zrender hit testing", () => {
  const start = APP_JS.indexOf('chart.getZr().on("click"');
  const end = APP_JS.indexOf('chart.on("legendselectchanged"', start);

  assert.notEqual(start, -1, "zrender click handler should exist");
  assert.notEqual(end, -1, "zrender click handler boundary should exist");

  const handlerBlock = APP_JS.slice(start, end);

  assert.match(handlerBlock, /chart\.containPixel\(\{ gridIndex: 0 \}, \[clickX, clickY\]\)/);
  assert.match(handlerBlock, /findNearestVisibleSeriesNameByPixel\(/);
  assert.match(handlerBlock, /toggleCityLineVisibility\(cityName\)/);
  assert.doesNotMatch(handlerBlock, /if \(event\?\.target\) return;/);
  assert.doesNotMatch(handlerBlock, /chart\.dispatchAction\(/);
  assert.equal(APP_JS.includes('chart.on("click", (params) => {'), false);
});
