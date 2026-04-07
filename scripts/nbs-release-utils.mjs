function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function roundTo(value, digits = 6) {
  if (!isFiniteNumber(value)) return null;
  return Number(value.toFixed(digits));
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&#12288;|&emsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(text) {
  return decodeHtmlEntities(String(text || "").replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCityName(name) {
  return String(name || "").replace(/\u3000/g, "").replace(/\s+/g, "").trim();
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

function extractReleaseMonth(title) {
  const normalizedTitle = normalizeCityName(stripHtml(title));
  const match = normalizedTitle.match(
    /^(\d{4})年(\d{1,2})月份70个大中城市商品住宅销售价格变动情况$/,
  );
  if (!match) return "";
  return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}`;
}

export function parseReleaseListPage(html, pageUrl) {
  const text = String(html || "");
  const pageCount = Number(text.match(/createPageHTML\((\d+)/)?.[1] || 1);
  const entries = [];
  const seenUrls = new Set();
  const linkRegex = /<a\b([^>]*?)href=(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const href = String(match[3] || "").trim();
    const attrs = `${match[1]} ${match[4]}`;
    const titleAttr = attrs.match(/\btitle=(["'])(.*?)\1/i)?.[2];
    const title = stripHtml(titleAttr || match[5]);
    const month = extractReleaseMonth(title);
    if (!href || !month) continue;

    const url = new URL(href, pageUrl).toString();
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    entries.push({ month, title, url });
  }

  return {
    pageCount: Number.isInteger(pageCount) && pageCount > 0 ? pageCount : 1,
    entries,
  };
}

export function parseOfficialReleaseSecondhandMomTable(html) {
  const tables = [...String(html || "").matchAll(/<table\b[\s\S]*?<\/table>/gi)];
  const tableHtml = tables[1]?.[0];
  if (!tableHtml) {
    throw new Error("Cannot locate table 2 from official NBS release page.");
  }

  const rows = [...tableHtml.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)];
  const momByCity = new Map();

  rows.slice(2).forEach((rowMatch) => {
    const rowHtml = rowMatch[0];
    const cells = [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cellMatch) =>
      stripHtml(cellMatch[1]),
    );

    if (cells.length !== 8) return;

    [cells.slice(0, 4), cells.slice(4, 8)].forEach((group) => {
      const city = normalizeCityName(group[0]);
      const momValue = Number(group[1]);
      if (!city || !Number.isFinite(momValue)) return;
      momByCity.set(city, momValue);
    });
  });

  if (momByCity.size !== 70) {
    throw new Error(`Expected 70 cities from official release table 2, got ${momByCity.size}.`);
  }

  return momByCity;
}

export function applyOfficialRelease(existingData, release) {
  const month = String(release?.month || "").trim();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error(`Invalid release month: ${month || "(empty)"}`);
  }

  const nextData = structuredClone(existingData);
  const dates = Array.isArray(nextData?.dates) ? [...nextData.dates] : [];
  const targetIndex = dates.indexOf(month);
  const writeIndex = targetIndex >= 0 ? targetIndex : dates.length;

  if (targetIndex < 0) {
    dates.push(month);
  }

  const normalizedMomByCity = new Map();
  for (const [cityName, momValue] of release?.momByCity || []) {
    normalizedMomByCity.set(normalizeCityName(cityName), momValue);
  }

  nextData.dates = dates;
  nextData.rowsParsed = dates.length;
  nextData.outputMaxMonth = dates[dates.length - 1] || month;
  nextData.latestMonthFromOfficialRelease = month;
  nextData.officialReleaseUrl = release?.url || nextData.officialReleaseUrl || null;

  const values = nextData?.values && typeof nextData.values === "object" ? nextData.values : {};
  nextData.values = values;

  const cities = Array.isArray(nextData?.cities) ? nextData.cities : [];
  cities.forEach((city) => {
    const series = Array.isArray(values[city.id]) ? [...values[city.id]] : [];
    while (series.length < dates.length) {
      series.push(null);
    }

    const prev = writeIndex > 0 ? series[writeIndex - 1] : city?.rebaseBaseValue ?? 100;
    const momValue = normalizedMomByCity.get(normalizeCityName(city?.name));
    let nextValue = null;

    if (isFiniteNumber(prev)) {
      if (isFiniteNumber(momValue) && momValue > 0) {
        nextValue = roundTo((prev * momValue) / 100, 6);
      } else {
        nextValue = roundTo(prev, 6);
      }
    }

    series[writeIndex] = nextValue;
    values[city.id] = series;
    city.availableRange = buildAvailableRange(series, dates);
    city.updatedAt = month;
  });

  return nextData;
}
