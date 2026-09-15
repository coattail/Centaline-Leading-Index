const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

test("dark chart annotations use a translucent line mask", () => {
  const source = readFileSync(resolve(__dirname, "..", "app.js"), "utf8");
  const darkTheme = source.match(
    /\[THEME_MODE_DARK\]: Object\.freeze\(\{([\s\S]*?)\n  \}\),/,
  );

  assert.ok(darkTheme, "dark chart theme should be defined");
  const mask = darkTheme[1].match(/textMaskColor:\s*"rgba\(([^)]+)\)"/);
  assert.ok(mask, "dark label mask should use rgba");

  const alpha = Number(mask[1].split(",").at(-1).trim());
  assert.ok(alpha > 0 && alpha < 1, "dark label mask should remain translucent");
});
