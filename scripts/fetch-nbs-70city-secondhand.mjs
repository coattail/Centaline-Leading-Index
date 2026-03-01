#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_URL = "https://data.stats.gov.cn/easyquery.htm";
const DB_CODE = "csyd";
const INDICATOR_ID = "A010807";
const DEFAULT_OUTPUT_MIN_MONTH = "2006-01";
const DEFAULT_OUTPUT_BASE_MONTH = "2006-01";
const REQUEST_TIMEOUT_MS = 20000;
const MAX_RETRIES = 5;

// NBS interface currently returns 71 reg nodes under this indicator.
// To keep the product requirement as "70 cities", we align to 70-city sample by excluding 拉萨.
const EXCLUDED_REG_CODES = new Set(["540100"]);

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function roundTo(value, digits = 6) {
  if (!isFiniteNumber(value)) return null;
  return Number(value.toFixed(digits));
}

function codeToMonth(code) {
  const text = String(code || "");
  if (!/^\d{6}$/.test(text)) return "";
  return `${text.slice(0, 4)}-${text.slice(4, 6)}`;
}

function normalizeMonthToken(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{4})[-/](\d{1,2})$/);
  if (!match) return "";
  return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}`;
}

function formatCurrentMonthUTC() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function minMonth(a, b) {
  return a <= b ? a : b;
}

function enumerateMonths(startMonth, endMonth) {
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(params, attempt = 1) {
  const query = new URLSearchParams({
    ...params,
    k1: String(Date.now() + Math.floor(Math.random() * 100000)),
  });
  const url = `${API_URL}?${query.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (attempt >= MAX_RETRIES) throw error;
    await sleep(380 * attempt);
    return requestJson(params, attempt + 1);
  } finally {
    clearTimeout(timeout);
  }
}

function parseNodeValue(node) {
  if (node?.data?.hasdata !== true) return null;
  const raw = node?.data?.data;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function parseNodeWds(node) {
  const wds = Array.isArray(node?.wds) ? node.wds : [];
  const map = new Map();
  wds.forEach((item) => {
    const wdcode = item?.wdcode;
    const valuecode = item?.valuecode;
    if (typeof wdcode === "string" && typeof valuecode === "string") {
      map.set(wdcode, valuecode);
    }
  });
  return map;
}

function getWdnodes(returndata, wdcode) {
  const wdnodes = Array.isArray(returndata?.wdnodes) ? returndata.wdnodes : [];
  const target = wdnodes.find((item) => item?.wdcode === wdcode);
  return Array.isArray(target?.nodes) ? target.nodes : [];
}

async function fetchYearRaw(year) {
  const payload = await requestJson({
    m: "QueryData",
    dbcode: DB_CODE,
    rowcode: "reg",
    colcode: "sj",
    wds: JSON.stringify([{ wdcode: "zb", valuecode: INDICATOR_ID }]),
    dfwds: JSON.stringify([{ wdcode: "sj", valuecode: String(year) }]),
  });

  if (payload?.returncode !== 200 || !payload?.returndata) {
    throw new Error(`NBS API returncode invalid for year ${year}.`);
  }

  return payload.returndata;
}

function cityNameFromMetric(metricName) {
  const raw = String(metricName || "").trim();
  if (!raw) return "";
  return raw.split(/[：:]/)[0].trim();
}

function buildAvailableRange(series, months) {
  let firstIndex = -1;
  let lastIndex = -1;
  for (let i = 0; i < series.length; i += 1) {
    if (isFiniteNumber(series[i])) {
      firstIndex = i;
      break;
    }
  }
  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (isFiniteNumber(series[i])) {
      lastIndex = i;
      break;
    }
  }
  if (firstIndex < 0 || lastIndex < 0 || firstIndex > lastIndex) return "";
  return `${months[firstIndex]}:${months[lastIndex]}`;
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const outputPath = process.argv[2] || path.resolve(__dirname, "..", "house-price-data-nbs-70.js");
  const outputMinMonth =
    normalizeMonthToken(process.env.NBS_OUTPUT_MIN_MONTH) || DEFAULT_OUTPUT_MIN_MONTH;
  const outputBaseMonth =
    normalizeMonthToken(process.env.NBS_OUTPUT_BASE_MONTH) || DEFAULT_OUTPUT_BASE_MONTH;
  const requestedMaxMonth =
    normalizeMonthToken(process.env.NBS_OUTPUT_MAX_MONTH) || formatCurrentMonthUTC();
  const outputJsonPath = outputPath.replace(/\.js$/i, ".json");
  if (!outputMinMonth || !outputBaseMonth || !requestedMaxMonth) {
    throw new Error("Invalid month settings. Expected YYYY-MM format.");
  }
  if (outputMinMonth > requestedMaxMonth) {
    throw new Error(`NBS_OUTPUT_MIN_MONTH (${outputMinMonth}) cannot be later than max month (${requestedMaxMonth}).`);
  }
  if (outputBaseMonth < outputMinMonth || outputBaseMonth > requestedMaxMonth) {
    throw new Error(`NBS_OUTPUT_BASE_MONTH (${outputBaseMonth}) must be within [${outputMinMonth}, ${requestedMaxMonth}].`);
  }

  const startYear = Number(outputMinMonth.slice(0, 4));
  const endYear = Number(requestedMaxMonth.slice(0, 4));

  const cityOrder = [];
  const cityNameByCode = new Map();
  const momByCity = new Map();
  let latestMonthFromApi = null;

  for (let year = startYear; year <= endYear; year += 1) {
    // eslint-disable-next-line no-console
    console.log(`Fetching NBS year ${year}...`);
    const returndata = await fetchYearRaw(year);
    const regNodes = getWdnodes(returndata, "reg");

    regNodes.forEach((node) => {
      const code = String(node?.code || "").trim();
      const name = String(node?.name || "").trim();
      if (!code || !name || EXCLUDED_REG_CODES.has(code)) return;
      if (!cityNameByCode.has(code)) {
        cityOrder.push(code);
      }
      cityNameByCode.set(code, cityNameFromMetric(name));
    });

    const datanodes = Array.isArray(returndata?.datanodes) ? returndata.datanodes : [];
    datanodes.forEach((node) => {
      const wdMap = parseNodeWds(node);
      const regCode = wdMap.get("reg");
      const sjCode = wdMap.get("sj");
      if (!regCode || EXCLUDED_REG_CODES.has(regCode) || !sjCode) return;

      const month = codeToMonth(sjCode);
      if (!month || month < outputMinMonth || month > requestedMaxMonth) return;

      const value = parseNodeValue(node);
      if (!isFiniteNumber(value)) return;

      if (!momByCity.has(regCode)) {
        momByCity.set(regCode, new Map());
      }
      momByCity.get(regCode).set(month, value);
      if (!latestMonthFromApi || month > latestMonthFromApi) {
        latestMonthFromApi = month;
      }
    });

    await sleep(120);
  }

  if (!latestMonthFromApi) {
    throw new Error("Cannot determine latest month from NBS API.");
  }

  const outputMaxMonth = minMonth(requestedMaxMonth, latestMonthFromApi);
  const months = enumerateMonths(outputMinMonth, outputMaxMonth);
  const baseMonthIndex = months.indexOf(outputBaseMonth);
  if (baseMonthIndex < 0) {
    throw new Error(`Cannot locate base month ${outputBaseMonth} in generated timeline.`);
  }

  const values = {};
  const cities = [];

  cityOrder.forEach((regCode) => {
    const cityName = cityNameByCode.get(regCode);
    if (!cityName) return;

    const momSeries = momByCity.get(regCode) || new Map();
    const chainedSeries = new Array(months.length).fill(null);
    chainedSeries[baseMonthIndex] = 100;

    for (let i = baseMonthIndex + 1; i < months.length; i += 1) {
      const prev = chainedSeries[i - 1];
      const momValue = momSeries.get(months[i]);
      if (!isFiniteNumber(prev)) {
        chainedSeries[i] = null;
      } else if (!isFiniteNumber(momValue) || momValue <= 0) {
        chainedSeries[i] = roundTo(prev, 6);
      } else {
        chainedSeries[i] = roundTo((prev * momValue) / 100, 6);
      }
    }

    const cityId = `city_nbs_${regCode}`;
    values[cityId] = chainedSeries;
    cities.push({
      id: cityId,
      name: cityName,
      metricName: `${cityName}:二手住宅销售价格指数(上月=100,链式定基)`,
      column: null,
      indicatorId: INDICATOR_ID,
      availableRange: buildAvailableRange(chainedSeries, months),
      source: "国家统计局(data.stats.gov.cn)",
      frequency: "月",
      updatedAt: latestMonthFromApi || outputMaxMonth,
      rebaseBaseMonth: outputBaseMonth,
      rebaseBaseValue: 100,
      regCode,
      chainedFrom: "上月=100",
    });
  });

  const outputData = {
    sourceFile: `${API_URL} (${DB_CODE}/${INDICATOR_ID})`,
    sheetName: "NBS_70city_secondhand",
    baseMonth: outputBaseMonth,
    rowsParsed: months.length,
    dates: months,
    cities,
    values,
    sourceName: "国家统计局70城二手住宅销售价格指数(上月=100,链式定基)",
    indicatorId: INDICATOR_ID,
    dbcode: DB_CODE,
    cityCount: cities.length,
    requestedMaxMonth,
    outputMaxMonth,
    latestMonthFromApi,
    excludedRegCodes: [...EXCLUDED_REG_CODES],
  };

  fs.writeFileSync(outputPath, `window.HOUSE_PRICE_SOURCE_DATA_NBS_70 = ${JSON.stringify(outputData, null, 2)};\n`, "utf8");
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(outputData, null, 2)}\n`, "utf8");

  // eslint-disable-next-line no-console
  console.log(`NBS data extracted: ${cities.length} cities, ${months.length} months.`);
  // eslint-disable-next-line no-console
  console.log(`Date range: ${months[0]} -> ${months[months.length - 1]}`);
  // eslint-disable-next-line no-console
  console.log(`JS output: ${outputPath}`);
  // eslint-disable-next-line no-console
  console.log(`JSON output: ${outputJsonPath}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to build NBS dataset:", error);
  process.exitCode = 1;
});
