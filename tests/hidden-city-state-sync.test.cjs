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
  "const uiState = { hiddenCityNames: new Set() };",
  "let renderCalls = 0;",
  "function render() { renderCalls += 1; }",
  extractFunctionSource("function areSetsEqual", "function pointToSegmentDistanceSquared"),
  extractFunctionSource("function syncHiddenCityNames", "function pointToSegmentDistanceSquared"),
  extractFunctionSource("function toggleCityLineVisibility", "function pointToSegmentDistanceSquared"),
  "this.api = { uiState, syncHiddenCityNames, toggleCityLineVisibility, getRenderCalls: () => renderCalls };",
].join("\n");

const helperContext = {};
vm.createContext(helperContext);
vm.runInContext(helperSource, helperContext, { timeout: 1000 });
const { uiState, syncHiddenCityNames, toggleCityLineVisibility, getRenderCalls } = helperContext.api;

test("syncHiddenCityNames only rerenders when the hidden set changes", () => {
  assert.equal(getRenderCalls(), 0);

  const firstChange = syncHiddenCityNames(new Set(["北京"]));
  assert.equal(firstChange, true);
  assert.deepEqual([...uiState.hiddenCityNames], ["北京"]);
  assert.equal(getRenderCalls(), 1);

  const sameState = syncHiddenCityNames(new Set(["北京"]));
  assert.equal(sameState, false);
  assert.deepEqual([...uiState.hiddenCityNames], ["北京"]);
  assert.equal(getRenderCalls(), 1);
});

test("toggleCityLineVisibility flips hidden state and rerenders", () => {
  toggleCityLineVisibility("上海");
  assert.deepEqual([...uiState.hiddenCityNames].sort(), ["上海", "北京"]);
  assert.equal(getRenderCalls(), 2);

  toggleCityLineVisibility("上海");
  assert.deepEqual([...uiState.hiddenCityNames], ["北京"]);
  assert.equal(getRenderCalls(), 3);
});
