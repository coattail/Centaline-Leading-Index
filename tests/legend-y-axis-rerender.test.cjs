const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const PROJECT_ROOT = resolve(__dirname, "..");
const APP_JS = readFileSync(resolve(PROJECT_ROOT, "app.js"), "utf8");

test("legend selection changes re-render the chart for y-axis recalculation", () => {
  const start = APP_JS.indexOf('chart.on("legendselectchanged"');
  const end = APP_JS.indexOf("if (timeZoomStartEl && timeZoomEndEl)", start);

  assert.notEqual(start, -1, "legendselectchanged handler should exist");
  assert.notEqual(end, -1, "legendselectchanged handler boundary should exist");

  const handlerBlock = APP_JS.slice(start, end);

  assert.match(handlerBlock, /syncHiddenCityNames\(hidden\)/);
});
