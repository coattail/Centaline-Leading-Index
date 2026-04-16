import test from "node:test";
import assert from "node:assert/strict";

import { cityNameFromMetric } from "../scripts/house-price-extract-utils.mjs";

test("cityNameFromMetric keeps the city name from the legacy metric format", () => {
  assert.equal(cityNameFromMetric("天津:中原领先指数"), "天津");
});

test("cityNameFromMetric extracts the city name from the new country-prefixed metric format", () => {
  assert.equal(cityNameFromMetric("中国:天津:中原领先指数"), "天津");
});

test("cityNameFromMetric supports the Hong Kong metric label", () => {
  assert.equal(cityNameFromMetric("香港:中原城市领先指数(CCL按月)"), "香港");
});
