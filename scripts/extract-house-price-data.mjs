#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { cityNameFromMetric } from "./house-price-extract-utils.mjs";

function decodeXmlText(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function excelSerialToYYYYMM(serial) {
  const epochMs = Date.UTC(1899, 11, 30);
  const ms = Math.round(Number(serial) * 24 * 60 * 60 * 1000);
  const date = new Date(epochMs + ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function unzipEntry(filePath, entryPath) {
  return execFileSync("unzip", ["-p", filePath, entryPath], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function colToIndex(col) {
  let num = 0;
  for (const char of col) {
    num = num * 26 + (char.charCodeAt(0) - 64);
  }
  return num;
}

function parseCellValue(cellAttrs, cellBody) {
  const typeMatch = cellAttrs.match(/t="([^"]+)"/);
  const type = typeMatch?.[1] || "";

  if (type === "inlineStr") {
    const textMatches = [...cellBody.matchAll(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g)];
    if (textMatches.length === 0) return "";
    return decodeXmlText(textMatches.map((match) => match[1]).join(""));
  }

  const vMatch = cellBody.match(/<v>([\s\S]*?)<\/v>/);
  if (!vMatch) return null;
  const raw = decodeXmlText(vMatch[1]).trim();
  if (raw === "") return null;

  if (type === "str" || type === "s") return raw;

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return numeric;
  return raw;
}

function parseRows(sheetXml) {
  const rows = new Map();
  const rowRegex = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowAttrs = rowMatch[1];
    const rowBody = rowMatch[2];
    const rowNum = Number(rowAttrs.match(/r="(\d+)"/)?.[1] || NaN);
    if (!Number.isFinite(rowNum)) continue;

    const cells = new Map();
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowBody)) !== null) {
      const cellAttrs = cellMatch[1];
      const cellBody = cellMatch[2];
      const ref = cellAttrs.match(/r="([A-Z]+)(\d+)"/);
      if (!ref) continue;
      const col = ref[1];
      cells.set(col, parseCellValue(cellAttrs, cellBody));
    }

    rows.set(rowNum, cells);
  }

  return rows;
}

function toOptionalNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

function readSheetName(workbookXml) {
  return workbookXml.match(/<sheet\b[^>]*name="([^"]+)"/)?.[1] || "sheet1";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = process.argv[2] || "/Users/coattail/Downloads/全面 二手房价格202601.xlsx";
const outputPath =
  process.argv[3] || path.resolve(__dirname, "..", "house-price-data.js");
const outputJsonPath = outputPath.replace(/\.js$/i, ".json");
const hkMonthlyPath = process.argv[4] || path.resolve(__dirname, "..", "hk-centaline-monthly.json");
const OUTPUT_MIN_MONTH = "2008-01";
const OUTPUT_BASE_MONTH = "2008-01";

function roundTo(value, digits = 6) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

const workbookXml = unzipEntry(inputPath, "xl/workbook.xml");
const sheetXml = unzipEntry(inputPath, "xl/worksheets/sheet1.xml");
const rows = parseRows(sheetXml);

const cityHeaderRow = rows.get(33) || new Map();
const sortedCols = [...cityHeaderRow.keys()]
  .filter((col) => col !== "A")
  .sort((a, b) => colToIndex(a) - colToIndex(b));

const rowFrequency = rows.get(34) || new Map();
const rowIndicatorId = rows.get(36) || new Map();
const rowTimeRange = rows.get(37) || new Map();
const rowSource = rows.get(38) || new Map();
const rowUpdatedAt = rows.get(39) || new Map();
const EXCLUDED_CITY_NAMES = new Set(["成都"]);

const cities = sortedCols
  .map((col, idx) => {
    const metricName = String(cityHeaderRow.get(col) || "").trim();
    if (!metricName) return null;
    const cityName = cityNameFromMetric(metricName);
    if (!cityName) return null;
    if (EXCLUDED_CITY_NAMES.has(cityName)) return null;
    return {
      id: `city_${idx + 1}`,
      name: cityName,
      metricName,
      column: col,
      indicatorId: String(rowIndicatorId.get(col) || "").trim(),
      availableRange: String(rowTimeRange.get(col) || "").trim(),
      source: String(rowSource.get(col) || "").trim(),
      frequency: String(rowFrequency.get(col) || "").trim(),
      updatedAt: String(rowUpdatedAt.get(col) || "").trim(),
    };
  })
  .filter(Boolean);

const monthMap = new Map();

for (const [rowNum, row] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
  if (rowNum < 40) continue;

  const serial = toOptionalNumber(row.get("A"));
  if (!Number.isFinite(serial)) continue;

  const date = excelSerialToYYYYMM(serial);
  const values = {};
  let hasAtLeastOneValue = false;

  for (const city of cities) {
    const numeric = toOptionalNumber(row.get(city.column));
    values[city.id] = numeric;
    if (Number.isFinite(numeric)) hasAtLeastOneValue = true;
  }

  if (!hasAtLeastOneValue) continue;

  if (monthMap.has(date)) {
    const prev = monthMap.get(date);
    for (const city of cities) {
      if (Number.isFinite(values[city.id])) {
        prev[city.id] = values[city.id];
      }
    }
    monthMap.set(date, prev);
  } else {
    monthMap.set(date, values);
  }
}

const dates = [...monthMap.keys()].sort((a, b) => a.localeCompare(b));
const values = Object.fromEntries(
  cities.map((city) => [
    city.id,
    dates.map((date) => {
      const num = monthMap.get(date)?.[city.id];
      return Number.isFinite(num) ? num : null;
    }),
  ]),
);

if (fs.existsSync(hkMonthlyPath)) {
  const hkRaw = JSON.parse(fs.readFileSync(hkMonthlyPath, "utf8"));
  const hkMonths = hkRaw?.monthlySeries?.months;
  const hkVals = hkRaw?.monthlySeries?.values;

  if (Array.isArray(hkMonths) && Array.isArray(hkVals) && hkMonths.length === hkVals.length) {
    const monthToValue = new Map();
    hkMonths.forEach((month, idx) => {
      const value = hkVals[idx];
      if (typeof month !== "string") return;
      const numeric = Number(value);
      monthToValue.set(month, Number.isFinite(numeric) ? numeric : null);
    });

    const hkSeries = dates.map((month) => {
      const value = monthToValue.get(month);
      return Number.isFinite(value) ? value : null;
    });

    let firstIndex = -1;
    let lastIndex = -1;
    for (let i = 0; i < hkSeries.length; i += 1) {
      if (Number.isFinite(hkSeries[i])) {
        firstIndex = i;
        break;
      }
    }
    for (let i = hkSeries.length - 1; i >= 0; i -= 1) {
      if (Number.isFinite(hkSeries[i])) {
        lastIndex = i;
        break;
      }
    }

    const hkCity = {
      id: "city_hk",
      name: "香港",
      metricName: "香港:中原城市领先指数(CCL按月)",
      column: null,
      indicatorId: "HK_CCL_MONTHLY",
      availableRange:
        firstIndex >= 0 && lastIndex >= 0
          ? `${dates[firstIndex]}:${dates[lastIndex]}`
          : "",
      source: "中原地产香港官网(CCL)",
      frequency: "月(由周度取月末)",
      updatedAt:
        typeof hkRaw.extractedAt === "string" ? hkRaw.extractedAt.slice(0, 10) : "",
    };

    cities.push(hkCity);
    values[hkCity.id] = hkSeries;
  }
}

const outputStartIndex = dates.findIndex((month) => month >= OUTPUT_MIN_MONTH);
if (outputStartIndex < 0) {
  throw new Error(`Cannot find output start month ${OUTPUT_MIN_MONTH} in parsed data.`);
}

const outputDates = dates.slice(outputStartIndex);
const outputValues = Object.fromEntries(
  cities.map((city) => [city.id, (values[city.id] || []).slice(outputStartIndex)]),
);

const outputBaseIndex = outputDates.indexOf(OUTPUT_BASE_MONTH);
if (outputBaseIndex < 0) {
  throw new Error(`Cannot find output base month ${OUTPUT_BASE_MONTH} in output dates.`);
}

for (const city of cities) {
  const series = outputValues[city.id] || [];
  const baseValue = series[outputBaseIndex];

  const normalizeWithBase = (anchorValue) =>
    series.map((value) => {
      if (!Number.isFinite(value) || !Number.isFinite(anchorValue) || anchorValue <= 0) return null;
      return roundTo((value / anchorValue) * 100, 6);
    });

  if (Number.isFinite(baseValue) && baseValue > 0) {
    outputValues[city.id] = normalizeWithBase(baseValue);
    city.rebaseBaseMonth = OUTPUT_BASE_MONTH;
    city.rebaseBaseValue = roundTo(baseValue, 6);
    continue;
  }
  throw new Error(
    `City ${city.name} does not have valid value at ${OUTPUT_BASE_MONTH}, cannot enforce unified base.`,
  );
}

for (const city of cities) {
  const series = outputValues[city.id] || [];
  let firstIndex = -1;
  let lastIndex = -1;

  for (let i = 0; i < series.length; i += 1) {
    if (Number.isFinite(series[i])) {
      firstIndex = i;
      break;
    }
  }
  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (Number.isFinite(series[i])) {
      lastIndex = i;
      break;
    }
  }

  city.availableRange =
    firstIndex >= 0 && lastIndex >= 0 ? `${outputDates[firstIndex]}:${outputDates[lastIndex]}` : "";
}

const outputData = {
  sourceFile: inputPath,
  generatedAt: new Date().toISOString(),
  sheetName: readSheetName(workbookXml),
  baseMonth: OUTPUT_BASE_MONTH,
  rowsParsed: outputDates.length,
  dates: outputDates,
  cities,
  values: outputValues,
};

const jsBody = `window.HOUSE_PRICE_SOURCE_DATA = ${JSON.stringify(outputData, null, 2)};\n`;
fs.writeFileSync(outputPath, jsBody, "utf8");
fs.writeFileSync(outputJsonPath, `${JSON.stringify(outputData, null, 2)}\n`, "utf8");

const cityNames = cities.map((city) => city.name).join("、");
console.log(`Data extracted: ${cities.length} cities, ${outputDates.length} monthly rows.`);
console.log(`Cities: ${cityNames}`);
console.log(`Date range: ${outputDates[0]} -> ${outputDates[outputDates.length - 1]}`);
console.log(`JS output: ${outputPath}`);
console.log(`JSON output: ${outputJsonPath}`);
