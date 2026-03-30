const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { join, resolve } = require("node:path");
const { execFileSync } = require("node:child_process");

const PROJECT_ROOT = resolve(__dirname, "..");
const PWCLI_PATH = process.env.PWCLI_PATH || join(process.env.HOME || "", ".codex/skills/playwright/scripts/playwright_cli.sh");

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function readJsonResult(output) {
  const marker = "### Result";
  const markerIndex = output.indexOf(marker);
  assert.notStrictEqual(markerIndex, -1, `Playwright output did not include "${marker}".`);
  const jsonStart = output.indexOf("{", markerIndex);
  assert.notStrictEqual(jsonStart, -1, "Playwright result did not contain JSON.");

  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < output.length; i += 1) {
    const char = output[i];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        jsonEnd = i + 1;
        break;
      }
    }
  }
  assert.notStrictEqual(jsonEnd, -1, "Playwright JSON result was incomplete.");
  return JSON.parse(output.slice(jsonStart, jsonEnd));
}

function runPw(args) {
  return execFileSync("bash", [PWCLI_PATH, ...args], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      CODEX_HOME: process.env.CODEX_HOME || join(process.env.HOME || "", ".codex"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("wide desktop view keeps evenly sampled x-axis labels visible", async (t) => {
  const port = 9132;
  const session = `cli${Date.now().toString(36)}`;
  const server = spawn("python3", ["-m", "http.server", String(port)], {
    cwd: PROJECT_ROOT,
    stdio: "ignore",
  });

  const cleanup = async () => {
    try {
      runPw([`-s=${session}`, "close"]);
    } catch {}
    if (!server.killed) {
      server.kill("SIGTERM");
    }
  };

  t.after(cleanup);

  await sleep(1200);

  runPw([`-s=${session}`, "open", `http://127.0.0.1:${port}`]);
  await sleep(3600);
  runPw([`-s=${session}`, "resize", "2200", "1300"]);
  await sleep(1600);

  let result = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const output = runPw([
      `-s=${session}`,
      "eval",
      "() => { const chartEl = document.getElementById(\"chart\"); const chart = chartEl ? window.echarts.getInstanceByDom(chartEl) : null; const labels = chart ? chart.getZr().storage.getDisplayList().filter((el) => typeof el?.style?.text === \"string\" && /^\\d{4}-\\d{2}$/.test(el.style.text)).map((el) => el.style.text) : []; return { title: document.title, chartWidth: chartEl?.clientWidth || 0, labels }; }",
    ]);
    result = readJsonResult(output);
    if (Array.isArray(result.labels) && result.labels.length > 0) {
      break;
    }
    await sleep(500);
  }

  assert.equal(result.title, "中原领先指数 | 中国二手房价格分析");
  assert.equal(result.chartWidth, 1234);
  assert.deepEqual(result.labels, [
    "2008-01",
    "2009-11",
    "2011-08",
    "2013-06",
    "2015-04",
    "2017-02",
    "2018-11",
    "2020-09",
    "2022-07",
    "2024-04",
    "2026-02",
  ]);
});
