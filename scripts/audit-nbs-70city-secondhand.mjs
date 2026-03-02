#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_URL = "https://data.stats.gov.cn/easyquery.htm";
const DB_CODE = "csyd";
const INDICATOR_ID = "A010807";
const EXCLUDED_REG_CODES = new Set(["540100"]);
const ROUND_DIGITS = 1;
const FLAT_RUN_MIN_LENGTH = 6;
const EXTREME_MOM_THRESHOLD_PCT = 3;
const REQUEST_TIMEOUT_MS = 20000;
const MAX_RETRIES = 5;

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function roundTo(value, digits = 6) {
  if (!isFiniteNumber(value)) return null;
  return Number(value.toFixed(digits));
}

function monthCodeToToken(code) {
  const text = String(code || "").trim();
  if (!/^\d{6}$/.test(text)) return "";
  return `${text.slice(0, 4)}-${text.slice(4, 6)}`;
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

function parseNodeValue(node) {
  if (node?.data?.hasdata !== true) return null;
  const raw = Number(node?.data?.data);
  return Number.isFinite(raw) ? raw : null;
}

function extractYears(dates) {
  if (!Array.isArray(dates) || dates.length === 0) return [];
  const startYear = Number(String(dates[0]).slice(0, 4));
  const endYear = Number(String(dates[dates.length - 1]).slice(0, 4));
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear) || startYear > endYear) return [];
  const years = [];
  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }
  return years;
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

function buildSourceMomMap(returndata, rangeStartMonth, rangeEndMonth, collector) {
  const datanodes = Array.isArray(returndata?.datanodes) ? returndata.datanodes : [];
  datanodes.forEach((node) => {
    const wdMap = parseNodeWds(node);
    const regCode = wdMap.get("reg");
    const sjCode = wdMap.get("sj");
    if (!regCode || !sjCode || EXCLUDED_REG_CODES.has(regCode)) return;

    const month = monthCodeToToken(sjCode);
    if (!month || month < rangeStartMonth || month > rangeEndMonth) return;

    if (!collector.has(regCode)) collector.set(regCode, new Map());
    collector.get(regCode).set(month, {
      value: parseNodeValue(node),
      hasData: node?.data?.hasdata === true,
      raw: node?.data?.data,
    });
  });
}

function detectFlatRuns(series, dates, cityName) {
  const runs = [];
  let index = 0;
  while (index < series.length) {
    if (!isFiniteNumber(series[index])) {
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < series.length && isFiniteNumber(series[end]) && series[end] === series[index]) {
      end += 1;
    }

    const length = end - index;
    if (length >= FLAT_RUN_MIN_LENGTH) {
      runs.push({
        city: cityName,
        start: dates[index],
        end: dates[end - 1],
        length,
        value: series[index],
      });
    }
    index = end;
  }
  return runs;
}

function calcImpliedMom(prevValue, currentValue) {
  if (!isFiniteNumber(prevValue) || !isFiniteNumber(currentValue) || prevValue === 0) return null;
  return roundTo((currentValue / prevValue) * 100, ROUND_DIGITS);
}

function buildSummaryReport({
  dates,
  cities,
  values,
  sourceMomByReg,
}) {
  const mismatches = [];
  const zeroPlaceholderPoints = [];
  const missingCarryForwardPoints = [];
  const extremePoints = [];
  const flatRuns = [];
  let comparedPoints = 0;
  let maxDiff = 0;

  cities.forEach((city) => {
    const series = Array.isArray(values[city.id]) ? values[city.id] : [];
    const sourceMomMap = sourceMomByReg.get(city.regCode) || new Map();

    flatRuns.push(...detectFlatRuns(series, dates, city.name));

    for (let i = 1; i < dates.length; i += 1) {
      const month = dates[i];
      const impliedMom = calcImpliedMom(series[i - 1], series[i]);
      if (!isFiniteNumber(impliedMom)) continue;

      const sourceNode = sourceMomMap.get(month);
      const sourceValue = sourceNode?.value;

      if (isFiniteNumber(sourceValue) && sourceValue > 0) {
        const roundedSource = roundTo(sourceValue, ROUND_DIGITS);
        const diff = Math.abs(impliedMom - roundedSource);
        comparedPoints += 1;
        if (diff > maxDiff) maxDiff = diff;
        if (diff > 0.1) {
          mismatches.push({
            city: city.name,
            regCode: city.regCode,
            month,
            impliedMom,
            sourceMom: roundedSource,
          });
        }
      } else if (sourceValue === 0) {
        zeroPlaceholderPoints.push({
          city: city.name,
          regCode: city.regCode,
          month,
          impliedMom,
          sourceRaw: sourceNode?.raw ?? 0,
        });
      } else {
        missingCarryForwardPoints.push({
          city: city.name,
          regCode: city.regCode,
          month,
          impliedMom,
          hasData: sourceNode?.hasData ?? false,
        });
      }

      if (Math.abs(impliedMom - 100) >= EXTREME_MOM_THRESHOLD_PCT) {
        extremePoints.push({
          city: city.name,
          month,
          mom: impliedMom,
        });
      }
    }
  });

  extremePoints.sort((a, b) => Math.abs(b.mom - 100) - Math.abs(a.mom - 100));
  flatRuns.sort((a, b) => b.length - a.length);

  return {
    indicatorId: INDICATOR_ID,
    dateRange: `${dates[0]}:${dates[dates.length - 1]}`,
    cityCount: cities.length,
    comparedPoints,
    maxRoundedDiff: maxDiff,
    mismatchCount: mismatches.length,
    zeroPlaceholderCount: zeroPlaceholderPoints.length,
    missingCarryForwardCount: missingCarryForwardPoints.length,
    extremeMomCount: extremePoints.length,
    topMismatchPoints: mismatches.slice(0, 20),
    topExtremeMomPoints: extremePoints.slice(0, 20),
    longestFlatRuns: flatRuns.slice(0, 20),
    zeroPlaceholderPoints: zeroPlaceholderPoints.slice(0, 20),
    missingCarryForwardPoints: missingCarryForwardPoints.slice(0, 20),
  };
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const inputPath =
    process.argv[2] || path.resolve(__dirname, "..", "house-price-data-nbs-70.json");
  const outputPath = process.argv[3] || "";

  const sourceData = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const dates = Array.isArray(sourceData?.dates) ? sourceData.dates : [];
  const cities = Array.isArray(sourceData?.cities) ? sourceData.cities : [];
  const values = sourceData?.values && typeof sourceData.values === "object" ? sourceData.values : {};
  if (dates.length === 0 || cities.length === 0) {
    throw new Error("Invalid input dataset: missing dates or cities.");
  }

  const years = extractYears(dates);
  const sourceMomByReg = new Map();

  for (const year of years) {
    // eslint-disable-next-line no-console
    console.log(`Auditing against NBS year ${year}...`);
    const yearRaw = await fetchYearRaw(year);
    buildSourceMomMap(yearRaw, dates[0], dates[dates.length - 1], sourceMomByReg);
    await sleep(120);
  }

  const summary = buildSummaryReport({
    dates,
    cities,
    values,
    sourceMomByReg,
  });

  const outputText = `${JSON.stringify(summary, null, 2)}\n`;
  if (outputPath) {
    fs.writeFileSync(outputPath, outputText, "utf8");
    // eslint-disable-next-line no-console
    console.log(`Audit report saved: ${outputPath}`);
  }

  // eslint-disable-next-line no-console
  console.log(outputText);

  if (summary.mismatchCount > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("NBS quality audit failed:", error);
  process.exitCode = 1;
});
