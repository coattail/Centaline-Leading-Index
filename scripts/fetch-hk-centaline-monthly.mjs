#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function monthRange(startMonth, endMonth) {
  const [startYear, startM] = startMonth.split("-").map(Number);
  const [endYear, endM] = endMonth.split("-").map(Number);
  const months = [];

  let year = startYear;
  let month = startM;
  while (year < endYear || (year === endYear && month <= endM)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

function fetchHtml(url) {
  return execFileSync("curl", ["-L", "--max-time", "90", url], {
    encoding: "utf8",
    maxBuffer: 30 * 1024 * 1024,
  });
}

function parseNuxtData(html) {
  const match = html.match(/<script>window\.__NUXT__=(.*?);<\/script>/s);
  if (!match) {
    throw new Error("Cannot find window.__NUXT__ payload in page HTML.");
  }

  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(`window.__NUXT__=${match[1]};`, context, { timeout: 15000 });

  const nuxt = context.window.__NUXT__;
  const dates = nuxt?.state?.CCL?.ccl?.chartData?.date;
  const values = nuxt?.state?.CCL?.ccl?.chartData?.index;

  if (!Array.isArray(dates) || !Array.isArray(values) || dates.length !== values.length) {
    throw new Error("Cannot read CCL chartData from __NUXT__ payload.");
  }

  return { dates, values };
}

function toMonthlyLastValue(weeklyDates, weeklyValues, startMonth, endMonth) {
  const monthToLast = new Map();

  for (let i = 0; i < weeklyDates.length; i += 1) {
    const date = weeklyDates[i];
    const value = Number(weeklyValues[i]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !Number.isFinite(value)) continue;

    const month = date.slice(0, 7);
    const prev = monthToLast.get(month);
    if (!prev || date > prev.date) {
      monthToLast.set(month, { date, value });
    }
  }

  const months = monthRange(startMonth, endMonth);
  const monthly = months.map((month) => {
    const item = monthToLast.get(month);
    return item ? Number(item.value) : null;
  });

  return { months, monthly, monthToLast };
}

function formatCurrentMonthUTC() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceUrl = process.argv[2] || "https://hk.centanet.com/CCI/zh-cn/index";
const outputPath =
  process.argv[3] || path.resolve(__dirname, "..", "hk-centaline-monthly.json");
const startMonth = process.argv[4] || "2005-01";
const endMonth = process.argv[5] || formatCurrentMonthUTC();

const html = fetchHtml(sourceUrl);
const { dates: weeklyDates, values: weeklyValues } = parseNuxtData(html);
const { months, monthly, monthToLast } = toMonthlyLastValue(
  weeklyDates,
  weeklyValues,
  startMonth,
  endMonth,
);

const firstValueMonth = months.findIndex((month) => monthToLast.has(month));
const lastValueMonth =
  months.length -
  1 -
  [...months]
    .reverse()
    .findIndex((month) => monthToLast.has(month));

const output = {
  source: "Centaline Hong Kong CCL",
  sourceUrl,
  extractedAt: new Date().toISOString(),
  method: "Use official weekly CCL chartData from window.__NUXT__, take last available week of each month.",
  startMonth,
  endMonth,
  monthlySeries: {
    months,
    values: monthly,
  },
  valueRange:
    firstValueMonth >= 0 && lastValueMonth >= 0
      ? {
          startMonth: months[firstValueMonth],
          endMonth: months[lastValueMonth],
        }
      : null,
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Fetched weekly points: ${weeklyDates.length}`);
console.log(`Monthly points: ${months.length}`);
console.log(
  `Range with values: ${output.valueRange?.startMonth || "-"} -> ${
    output.valueRange?.endMonth || "-"
  }`,
);
console.log(`Output: ${outputPath}`);
