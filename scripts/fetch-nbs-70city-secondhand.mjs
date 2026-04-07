#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyOfficialRelease,
  parseOfficialReleaseSecondhandMomTable,
  parseReleaseListPage,
} from "./nbs-release-utils.mjs";

const API_URL = "https://data.stats.gov.cn/easyquery.htm";
const DB_CODE = "csyd";
const INDICATOR_ID = "A010807";
const DEFAULT_OUTPUT_MIN_MONTH = "2006-01";
const DEFAULT_OUTPUT_BASE_MONTH = "2006-01";
const OFFICIAL_RELEASE_LIST_URL = "https://www.stats.gov.cn/sj/zxfb/";
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

async function requestText(url, attempt = 1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (attempt >= MAX_RETRIES) throw error;
    await sleep(380 * attempt);
    return requestText(url, attempt + 1);
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

function writeOutput(outputPath, outputJsonPath, outputData) {
  fs.writeFileSync(
    outputPath,
    `window.HOUSE_PRICE_SOURCE_DATA_NBS_70 = ${JSON.stringify(outputData, null, 2)};\n`,
    "utf8",
  );
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(outputData, null, 2)}\n`, "utf8");
}

function loadExistingOutputData(outputJsonPath) {
  if (!fs.existsSync(outputJsonPath)) return null;
  return JSON.parse(fs.readFileSync(outputJsonPath, "utf8"));
}

function getLatestMonthFromExistingData(existingData) {
  const dates = Array.isArray(existingData?.dates) ? existingData.dates : [];
  return normalizeMonthToken(dates[dates.length - 1] || existingData?.outputMaxMonth || "");
}

function buildOfficialReleaseListPageUrl(pageIndex) {
  if (pageIndex <= 0) return OFFICIAL_RELEASE_LIST_URL;
  return new URL(`index_${pageIndex}.html`, OFFICIAL_RELEASE_LIST_URL).toString();
}

async function collectOfficialReleaseEntries({ currentLatestMonth, requestedMaxMonth }) {
  const entriesByMonth = new Map();
  let pageCount = 1;

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const pageUrl = buildOfficialReleaseListPageUrl(pageIndex);
    // eslint-disable-next-line no-console
    console.log(`Scanning official release list page ${pageIndex + 1}${pageCount > 1 ? `/${pageCount}` : ""}...`);
    const html = await requestText(pageUrl);
    const parsed = parseReleaseListPage(html, pageUrl);
    if (pageIndex === 0) {
      pageCount = parsed.pageCount;
    }

    let canStop = false;
    parsed.entries.forEach((entry) => {
      if (entry.month > requestedMaxMonth) return;
      if (currentLatestMonth && entry.month <= currentLatestMonth) {
        canStop = true;
        return;
      }
      if (!entriesByMonth.has(entry.month)) {
        entriesByMonth.set(entry.month, entry);
      }
    });

    if (canStop) break;
    await sleep(120);
  }

  return [...entriesByMonth.values()].sort((left, right) => left.month.localeCompare(right.month));
}

async function updateFromOfficialReleases(existingData, requestedMaxMonth) {
  const currentLatestMonth = getLatestMonthFromExistingData(existingData);
  const entries = await collectOfficialReleaseEntries({
    currentLatestMonth,
    requestedMaxMonth,
  });

  if (entries.length === 0) {
    return {
      updated: false,
      outputData: existingData,
      currentLatestMonth,
    };
  }

  let outputData = structuredClone(existingData);

  for (const entry of entries) {
    // eslint-disable-next-line no-console
    console.log(`Applying official release ${entry.month}: ${entry.url}`);
    const articleHtml = await requestText(entry.url);
    const momByCity = parseOfficialReleaseSecondhandMomTable(articleHtml);
    outputData = applyOfficialRelease(outputData, {
      month: entry.month,
      url: entry.url,
      momByCity,
    });
    await sleep(120);
  }

  outputData.requestedMaxMonth = requestedMaxMonth;
  outputData.outputMaxMonth = minMonth(
    requestedMaxMonth,
    outputData.dates[outputData.dates.length - 1] || requestedMaxMonth,
  );
  outputData.cityCount = Array.isArray(outputData.cities) ? outputData.cities.length : 0;
  outputData.sourceFile = `${OFFICIAL_RELEASE_LIST_URL} (official release incremental update)`;
  outputData.sourceName =
    outputData.sourceName || "国家统计局70城二手住宅销售价格指数(上月=100,链式定基)";
  outputData.indicatorId = outputData.indicatorId || INDICATOR_ID;
  outputData.dbcode = outputData.dbcode || DB_CODE;
  outputData.excludedRegCodes = outputData.excludedRegCodes || [...EXCLUDED_REG_CODES];

  return {
    updated: true,
    outputData,
    appliedEntries: entries,
  };
}

async function buildDatasetFromApi({
  outputMinMonth,
  outputBaseMonth,
  requestedMaxMonth,
  officialReleaseUrl,
}) {
  const startYear = Number(outputMinMonth.slice(0, 4));
  const endYear = Number(requestedMaxMonth.slice(0, 4));

  const cityOrder = [];
  const cityNameByCode = new Map();
  const momByCity = new Map();
  let latestMonthFromApi = null;
  let latestMonthFromOfficialRelease = null;

  for (let year = startYear; year <= endYear; year += 1) {
    // eslint-disable-next-line no-console
    console.log(`Fetching NBS year ${year} from API...`);
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

  if (officialReleaseUrl && requestedMaxMonth > latestMonthFromApi) {
    const officialHtml = await requestText(officialReleaseUrl);
    const officialMomByCity = parseOfficialReleaseSecondhandMomTable(officialHtml);

    cityOrder.forEach((regCode) => {
      const cityName = cityNameByCode.get(regCode);
      const momValue = officialMomByCity.get(cityName);
      if (!Number.isFinite(momValue)) return;
      if (!momByCity.has(regCode)) {
        momByCity.set(regCode, new Map());
      }
      momByCity.get(regCode).set(requestedMaxMonth, momValue);
    });

    latestMonthFromOfficialRelease = requestedMaxMonth;
  }

  const latestAvailableMonth = latestMonthFromOfficialRelease || latestMonthFromApi;
  const outputMaxMonth = minMonth(requestedMaxMonth, latestAvailableMonth);
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
      updatedAt: latestAvailableMonth || outputMaxMonth,
      rebaseBaseMonth: outputBaseMonth,
      rebaseBaseValue: 100,
      regCode,
      chainedFrom: "上月=100",
    });
  });

  return {
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
    latestMonthFromOfficialRelease,
    officialReleaseUrl: officialReleaseUrl || null,
    excludedRegCodes: [...EXCLUDED_REG_CODES],
  };
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const outputPath =
    process.argv[2] || path.resolve(__dirname, "..", "house-price-data-nbs-70.js");
  const outputMinMonth =
    normalizeMonthToken(process.env.NBS_OUTPUT_MIN_MONTH) || DEFAULT_OUTPUT_MIN_MONTH;
  const outputBaseMonth =
    normalizeMonthToken(process.env.NBS_OUTPUT_BASE_MONTH) || DEFAULT_OUTPUT_BASE_MONTH;
  const requestedMaxMonth =
    normalizeMonthToken(process.env.NBS_OUTPUT_MAX_MONTH) || formatCurrentMonthUTC();
  const outputJsonPath = outputPath.replace(/\.js$/i, ".json");
  const officialReleaseUrl = String(process.env.NBS_OFFICIAL_RELEASE_URL || "").trim();
  const forceFullRebuild = String(process.env.NBS_FORCE_FULL_REBUILD || "").trim() === "1";

  if (!outputMinMonth || !outputBaseMonth || !requestedMaxMonth) {
    throw new Error("Invalid month settings. Expected YYYY-MM format.");
  }
  if (outputMinMonth > requestedMaxMonth) {
    throw new Error(
      `NBS_OUTPUT_MIN_MONTH (${outputMinMonth}) cannot be later than max month (${requestedMaxMonth}).`,
    );
  }
  if (outputBaseMonth < outputMinMonth || outputBaseMonth > requestedMaxMonth) {
    throw new Error(
      `NBS_OUTPUT_BASE_MONTH (${outputBaseMonth}) must be within [${outputMinMonth}, ${requestedMaxMonth}].`,
    );
  }

  const existingData = !forceFullRebuild ? loadExistingOutputData(outputJsonPath) : null;
  const canUseIncremental =
    existingData &&
    Array.isArray(existingData?.dates) &&
    existingData.dates.length > 0 &&
    existingData.dates[0] === outputMinMonth &&
    normalizeMonthToken(existingData?.baseMonth) === outputBaseMonth;

  if (canUseIncremental) {
    // eslint-disable-next-line no-console
    console.log("Using official release incremental update path.");
    const result = await updateFromOfficialReleases(existingData, requestedMaxMonth);

    if (!result.updated) {
      // eslint-disable-next-line no-console
      console.log(
        `No newer official NBS release found beyond ${result.currentLatestMonth || outputBaseMonth}.`,
      );
      return;
    }

    writeOutput(outputPath, outputJsonPath, result.outputData);
    // eslint-disable-next-line no-console
    console.log(
      `Official releases applied: ${result.appliedEntries.map((entry) => entry.month).join(", ")}`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `Date range: ${result.outputData.dates[0]} -> ${
        result.outputData.dates[result.outputData.dates.length - 1]
      }`,
    );
    // eslint-disable-next-line no-console
    console.log(`JS output: ${outputPath}`);
    // eslint-disable-next-line no-console
    console.log(`JSON output: ${outputJsonPath}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Falling back to full API rebuild path.");
  const outputData = await buildDatasetFromApi({
    outputMinMonth,
    outputBaseMonth,
    requestedMaxMonth,
    officialReleaseUrl,
  });
  writeOutput(outputPath, outputJsonPath, outputData);

  // eslint-disable-next-line no-console
  console.log(`NBS data extracted: ${outputData.cities.length} cities, ${outputData.dates.length} months.`);
  // eslint-disable-next-line no-console
  console.log(
    `Date range: ${outputData.dates[0]} -> ${outputData.dates[outputData.dates.length - 1]}`,
  );
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
