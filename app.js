let raw = null;
let activeSourceMeta = null;

const SOURCE_CONFIGS = [
  {
    key: "centaline6",
    label: "中原领先指数（6城）",
    legendLabel: "中原",
    sourceTitle: "中原领先指数（月度）",
    heroSubtitle: "数据来源：Wind、中原研究中心",
    defaultSelectedNames: null,
    data: window.HOUSE_PRICE_SOURCE_DATA,
  },
  {
    key: "nbs70",
    label: "国家统计局（二手住宅70城）",
    legendLabel: "统计局",
    sourceTitle: "国家统计局70城二手住宅销售价格指数（上月=100，链式定基）",
    heroSubtitle: "数据来源：国家统计局（70城二手住宅销售价格指数）",
    defaultSelectedNames: ["北京", "上海", "广州", "深圳", "天津", "重庆"],
    data: window.HOUSE_PRICE_SOURCE_DATA_NBS_70,
  },
];

const cityListEl = document.getElementById("cityList");
const startMonthEl = document.getElementById("startMonth");
const endMonthEl = document.getElementById("endMonth");
const dataSourceEl = document.getElementById("dataSource");
const themeModeEl = document.getElementById("themeMode");
const cityBlockTitleEl = document.getElementById("cityBlockTitle");
const citySearchWrapEl = document.getElementById("citySearchWrap");
const citySearchInputEl = document.getElementById("citySearchInput");
const citySearchHintEl = document.getElementById("citySearchHint");
const compareSourceEl = document.getElementById("compareSource");
const compareHintEl = document.getElementById("compareHint");
const renderBtn = document.getElementById("renderBtn");
const selectAllBtn = document.getElementById("selectAllBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const drawdownBtn = document.getElementById("drawdownBtn");
const chartTableBtn = document.getElementById("chartTableBtn");
const statusEl = document.getElementById("statusText");
const summaryBodyEl = document.getElementById("summaryBody");
const chartTitleEl = document.getElementById("chartTitle");
const chartMetaEl = document.getElementById("chartMeta");
const footnoteEl = document.getElementById("footnoteText");
const chartStatsOverlayEl = document.getElementById("chartStatsOverlay");
const chartEl = document.getElementById("chart");
const chartStageEl = chartEl ? chartEl.closest(".chart-stage") : null;
const timeZoomWidgetEl = document.getElementById("timeZoomWidget");
const timeZoomRangeTextEl = document.getElementById("timeZoomRangeText");
const timeZoomFillEl = document.getElementById("timeZoomFill");
const timeZoomStartEl = document.getElementById("timeZoomStart");
const timeZoomEndEl = document.getElementById("timeZoomEnd");
const sourceSubtitleEl = document.getElementById("sourceSubtitleText");
const THEME_MODE_STORAGE_KEY = "house-price-theme-mode";
const THEME_MODE_LIGHT = "light";
const THEME_MODE_DARK = "dark";

const chart = echarts.init(chartEl, null, {
  renderer: "canvas",
});

const LEGACY_CORE_CITY_COLORS = Object.freeze({
  北京: "#5b9bd5",
  上海: "#e2843f",
  深圳: "#5d8f47",
  广州: "#e6b311",
  香港: "#1d1d1d",
  天津: "#7d8b99",
});
const LEGACY_CORE_CITY_COLORS_DARK = Object.freeze({
  北京: "#73c5ff",
  上海: "#f7b34d",
  深圳: "#74d29c",
  广州: "#f2cf6b",
  香港: "#c9d5df",
  天津: "#8db3cc",
});
const OTHER_CITY_DISTINCT_PALETTE = [
  "#c63f4b",
  "#8a58d0",
  "#0d9aa0",
  "#c0447f",
  "#58923a",
  "#c9782d",
  "#526ad1",
  "#2d7eb9",
  "#90864b",
  "#9b5bc1",
  "#ca6b56",
  "#1d9b73",
  "#b74472",
  "#4463b5",
];
const OTHER_CITY_DISTINCT_PALETTE_DARK = [
  "#ff8f99",
  "#cb9dff",
  "#66d3d9",
  "#ff9dc8",
  "#95ce74",
  "#ffbf74",
  "#9ea9ff",
  "#6fb6ff",
  "#b9bb86",
  "#d39eff",
  "#ffb595",
  "#8ddfbb",
  "#ff94b8",
  "#a5c4ff",
  "#ffd28a",
];
const OVERLAY_CITY_ORDER = ["北京", "上海", "广州", "深圳", "天津", "香港"];
const OVERLAY_CITY_ORDER_INDEX = new Map(
  OVERLAY_CITY_ORDER.map((name, index) => [name, index]),
);
const CHART_FONT_FACE = "ProjectChartSTKaiti";
const CHART_FONT_FAMILY =
  '"ProjectChartSTKaiti", "STKaiti", "Kaiti SC", "KaiTi", "BiauKai", serif';
const CHART_FONT_LOAD_TARGETS = Object.freeze([
  `400 16px "${CHART_FONT_FACE}"`,
  `600 16px "${CHART_FONT_FACE}"`,
  `700 16px "${CHART_FONT_FACE}"`,
]);
const CHART_LAYOUT_BASE_WIDTH = 1160;
const CHART_LAYOUT_ASPECT_RATIO = 0.78;
const CHART_LAYOUT_MIN_HEIGHT = 420;
const CHART_LAYOUT_MAX_HEIGHT = 1080;
const RESPONSIVE_BREAKPOINTS = Object.freeze({
  compact: 520,
  medium: 760,
  large: 1120,
});
const OVERLAY_LEFT_RATIO = 0.12;
const OVERLAY_TOP_RATIO = 0.05;
const OVERLAY_SCALE_MIN = 0.72;
const OVERLAY_SCALE_MAX = 1.3;
const OVERLAY_TABLE_SCALE = 1.05;
const OVERLAY_EMPHASIS_SCALE = 1.05;
const CHART_GRID_LAYOUT = Object.freeze({
  left: 70,
  right: 90,
  top: 44,
  bottom: 112,
});
const RESPONSIVE_GRID_LAYOUTS = Object.freeze({
  compact: Object.freeze({
    left: 52,
    right: 34,
    top: 36,
    bottom: 92,
  }),
  medium: Object.freeze({
    left: 60,
    right: 42,
    top: 40,
    bottom: 100,
  }),
  large: Object.freeze({
    left: 66,
    right: 62,
    top: 42,
    bottom: 106,
  }),
});
const RESPONSIVE_CHART_LAYOUTS = Object.freeze({
  compact: Object.freeze({
    aspectRatio: 0.88,
    minHeight: 330,
    maxHeight: 560,
    overlayScaleMin: 0.44,
    overlayScaleMax: 0.8,
    overlayLeftRatio: 0.185,
    overlayTopRatio: 0.045,
  }),
  medium: Object.freeze({
    aspectRatio: 0.84,
    minHeight: 360,
    maxHeight: 660,
    overlayScaleMin: 0.46,
    overlayScaleMax: 0.9,
    overlayLeftRatio: 0.16,
    overlayTopRatio: 0.046,
  }),
  large: Object.freeze({
    aspectRatio: 0.74,
    minHeight: 420,
    maxHeight: 920,
    overlayScaleMin: 0.62,
    overlayScaleMax: 1.08,
    overlayLeftRatio: 0.14,
    overlayTopRatio: 0.05,
  }),
});
const RESPONSIVE_XAXIS_PRESETS = Object.freeze({
  compact: Object.freeze({
    maxLabels: 5,
    fontSize: 10.1,
    margin: 12,
    minGapPx: 72,
  }),
  medium: Object.freeze({
    maxLabels: 7,
    fontSize: 10.8,
    margin: 13,
    minGapPx: 86,
  }),
  large: Object.freeze({
    maxLabels: 10,
    fontSize: 11.8,
    margin: 14,
    minGapPx: 104,
  }),
  default: Object.freeze({
    maxLabels: 14,
    fontSize: 11.8,
    margin: 14,
    minGapPx: 104,
  }),
});
const RESPONSIVE_OVERLAY_SAFE_GAPS = Object.freeze({
  compact: 36,
  medium: 30,
  default: 18,
});
const CHART_THEME_STYLES = Object.freeze({
  [THEME_MODE_LIGHT]: Object.freeze({
    chartBackground: "#fbfeff",
    chartTextColor: "#1d435d",
    legendTextColor: "#000000",
    xAxisLineColor: "#000000",
    xAxisLabelColor: "#000000",
    yAxisLineColor: "#000000",
    yAxisLabelColor: "#000000",
    sliderHandleColor: "rgba(255, 255, 255, 0.82)",
    sliderHandleBorderColor: "rgba(26, 143, 227, 0.84)",
    sliderHandleHoverColor: "rgba(255, 255, 255, 0.95)",
    sliderHandleHoverBorderColor: "rgba(26, 143, 227, 0.95)",
    textMaskColor: "rgba(245, 252, 255, 0.62)",
    overlayTitleColor: "#1f3e53",
    overlayLineColor: "#607786",
    overlayTextColor: "#1f394b",
    overlaySubTextColor: "#436277",
    tooltipBackground: "rgba(248, 253, 255, 0.98)",
    tooltipBorderColor: "rgba(150, 181, 203, 0.96)",
    tooltipTextColor: "#23506c",
    tooltipAxisPointerColor: "rgba(95, 129, 153, 0.9)",
    tooltipExtraCssText:
      "border-radius:8px;box-shadow:0 12px 26px rgba(20,48,74,.22);backdrop-filter:blur(2px);",
  }),
  [THEME_MODE_DARK]: Object.freeze({
    chartBackground: "#09131b",
    chartTextColor: "#dde7ee",
    legendTextColor: "#FFFFFF",
    xAxisLineColor: "#FFFFFF",
    xAxisLabelColor: "#FFFFFF",
    yAxisLineColor: "#FFFFFF",
    yAxisLabelColor: "#FFFFFF",
    sliderHandleColor: "rgba(245, 164, 59, 0.4)",
    sliderHandleBorderColor: "rgba(245, 164, 59, 0.95)",
    sliderHandleHoverColor: "rgba(255, 192, 105, 0.5)",
    sliderHandleHoverBorderColor: "rgba(255, 192, 105, 0.99)",
    textMaskColor: "rgba(6, 12, 18, 0.66)",
    overlayTitleColor: "#FFFFFF",
    overlayLineColor: "#FFFFFF",
    overlayTextColor: "#FFFFFF",
    overlaySubTextColor: "#FFFFFF",
    tooltipBackground: "rgba(9, 17, 24, 0.97)",
    tooltipBorderColor: "rgba(245, 164, 59, 0.62)",
    tooltipTextColor: "#dde9f2",
    tooltipAxisPointerColor: "rgba(245, 164, 59, 0.86)",
    tooltipExtraCssText:
      "border-radius:8px;box-shadow:0 18px 36px rgba(0,0,0,.56);backdrop-filter:blur(2px);",
  }),
});
const MAX_SELECTED_CITY_COUNT = 6;
const COMPARE_CITY_WHITELIST = new Set(["北京", "上海", "广州", "深圳", "天津"]);
const OVERLAY_SOURCE_PROFILES = Object.freeze({
  centaline6: {
    tableTitle: "中原领先指数",
    sourceNote: "Wind、中原",
  },
  nbs70: {
    tableTitle: "统计局指数",
    sourceNote: "国家统计局",
  },
});
const CITY_LIST_THREE_COLS_CLASS = "city-list--three-cols";
const PROVINCE_NAME_BY_CODE = Object.freeze({
  "11": "北京市",
  "12": "天津市",
  "13": "河北省",
  "14": "山西省",
  "15": "内蒙古自治区",
  "21": "辽宁省",
  "22": "吉林省",
  "23": "黑龙江省",
  "31": "上海市",
  "32": "江苏省",
  "33": "浙江省",
  "34": "安徽省",
  "35": "福建省",
  "36": "江西省",
  "37": "山东省",
  "41": "河南省",
  "42": "湖北省",
  "43": "湖南省",
  "44": "广东省",
  "45": "广西壮族自治区",
  "46": "海南省",
  "50": "重庆市",
  "51": "四川省",
  "52": "贵州省",
  "53": "云南省",
  "54": "西藏自治区",
  "61": "陕西省",
  "62": "甘肃省",
  "63": "青海省",
  "64": "宁夏回族自治区",
  "65": "新疆维吾尔自治区",
});
const PROVINCE_EXTRA_ALIASES = Object.freeze({
  "11": ["北京"],
  "12": ["天津"],
  "15": ["内蒙古", "内蒙"],
  "31": ["上海"],
  "45": ["广西"],
  "50": ["重庆"],
  "54": ["西藏"],
  "64": ["宁夏"],
  "65": ["新疆"],
});
const cityById = new Map();
const cityValidRanges = new Map();
const uiState = {
  showDrawdownAnalysis: false,
  showChartTable: true,
  hiddenCityNames: new Set(),
  zoomStartMonth: null,
  zoomEndMonth: null,
};
let isApplyingOption = false;
let latestRenderContext = null;
let isSyncingRangeFromSlider = false;
let timeZoomMonths = [];
let timeZoomRenderFrame = null;
let isSyncingTimeZoomInputs = false;
let textMeasureContext = null;
let resizeRenderTimer = null;
let chartFontsReadyPromise = null;

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value, digits = 1) {
  if (!isFiniteNumber(value)) return "-";
  return Number(value).toFixed(digits);
}

function formatPercent(value, digits = 1) {
  if (!isFiniteNumber(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

function formatMonthZh(month) {
  if (!/^\d{4}-\d{2}$/.test(String(month))) return String(month || "-");
  const [year, m] = String(month).split("-");
  return `${year}年${Number(m)}月`;
}

function formatOverlayRangeLabel(startMonth, endMonth) {
  return `${formatMonthZh(startMonth)}－${formatMonthZh(endMonth)}`;
}

function formatOverlayBaseLabel(baseMonth) {
  return `定基${formatMonthZh(baseMonth)}＝100`;
}

function waitForChartFonts(timeoutMs = 1800) {
  if (typeof document === "undefined" || !document.fonts) {
    return Promise.resolve();
  }
  if (typeof document.fonts.load !== "function") {
    return Promise.resolve();
  }
  if (chartFontsReadyPromise) return chartFontsReadyPromise;

  const sampleText = "房价指数";
  const allLoaded =
    typeof document.fonts.check === "function" &&
    CHART_FONT_LOAD_TARGETS.every((descriptor) => document.fonts.check(descriptor, sampleText));
  if (allLoaded) {
    chartFontsReadyPromise = Promise.resolve();
    return chartFontsReadyPromise;
  }

  const loadPromise = Promise.all(
    CHART_FONT_LOAD_TARGETS.map((descriptor) => document.fonts.load(descriptor, sampleText)),
  ).catch(() => undefined);

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, timeoutMs));
  });

  chartFontsReadyPromise = Promise.race([loadPromise, timeoutPromise])
    .then(() => document.fonts.ready.catch(() => undefined))
    .then(() => undefined);

  return chartFontsReadyPromise;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    if (char === '"') return "&quot;";
    return "&#39;";
  });
}

function populateSelectOptions(selectEl, options) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  for (const option of options) {
    const optionEl = document.createElement("option");
    optionEl.value = String(option.value ?? "");
    optionEl.textContent = String(option.label ?? "");
    fragment.appendChild(optionEl);
  }
  selectEl.appendChild(fragment);
}

function getOverlayMonthTextSegments(month) {
  const normalized = normalizeMonthToken(month);
  const matched = normalized.match(/^(\d{4})-(\d{2})$/);
  if (!matched) {
    return [
      {
        text: formatMonthZh(month),
        isDigit: false,
      },
    ];
  }
  const monthNumber = String(Number(matched[2]));
  return [
    { text: matched[1], isDigit: true },
    { text: "年", isDigit: false },
    { text: monthNumber, isDigit: true },
    { text: "月", isDigit: false },
  ];
}

function renderOverlayTextSegmentsHtml(segments) {
  return segments
    .map((segment) => {
      const text = escapeHtml(segment.text);
      if (!segment.isDigit) return text;
      return `<span class="chart-stats-digit">${text}</span>`;
    })
    .join("");
}

function buildOverlayRangeHtml(startMonth, endMonth) {
  const startHtml = renderOverlayTextSegmentsHtml(getOverlayMonthTextSegments(startMonth));
  const endHtml = renderOverlayTextSegmentsHtml(getOverlayMonthTextSegments(endMonth));
  return `${startHtml}<span class="chart-stats-range-sep">－</span>${endHtml}`;
}

function buildOverlayBaseValueHtml(baseMonth) {
  const monthHtml = renderOverlayTextSegmentsHtml(getOverlayMonthTextSegments(baseMonth));
  return `${monthHtml}<span class="chart-stats-base-eq">＝</span><span class="chart-stats-digit">100</span>`;
}

function measureOverlayTextSegments(ctx, segments) {
  return segments.reduce((width, segment) => width + ctx.measureText(segment.text).width, 0);
}

function drawOverlayTextSegments(ctx, startX, y, segments, digitOffsetY = 0) {
  let cursorX = startX;
  for (const segment of segments) {
    const drawY = segment.isDigit ? y + digitOffsetY : y;
    ctx.fillText(segment.text, cursorX, drawY);
    cursorX += ctx.measureText(segment.text).width;
  }
  return cursorX - startX;
}

function formatMonthDot(month) {
  const token = normalizeMonthToken(month);
  if (!token) return "";
  const matched = token.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return token;
  return `${matched[1]}.${matched[2]}`;
}

function normalizeMonthToken(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}$/.test(text)) {
    return `${text}-01`;
  }
  const matched = text.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (matched) {
    const year = matched[1];
    const month = String(Number(matched[2])).padStart(2, "0");
    return `${year}-${month}`;
  }
  return text;
}

function normalizeThemeMode(value) {
  return value === THEME_MODE_DARK ? THEME_MODE_DARK : THEME_MODE_LIGHT;
}

function readStoredThemeMode() {
  try {
    return normalizeThemeMode(window.localStorage.getItem(THEME_MODE_STORAGE_KEY));
  } catch (error) {
    return THEME_MODE_LIGHT;
  }
}

function getCurrentThemeMode() {
  const mode = document.body?.dataset?.theme;
  return normalizeThemeMode(mode);
}

function getActiveChartThemeStyle() {
  return CHART_THEME_STYLES[getCurrentThemeMode()] || CHART_THEME_STYLES[THEME_MODE_LIGHT];
}

function getThemeCoreCityPalette(themeMode = getCurrentThemeMode()) {
  return normalizeThemeMode(themeMode) === THEME_MODE_DARK
    ? LEGACY_CORE_CITY_COLORS_DARK
    : LEGACY_CORE_CITY_COLORS;
}

function getThemeCityPalette(themeMode = getCurrentThemeMode()) {
  return normalizeThemeMode(themeMode) === THEME_MODE_DARK
    ? OTHER_CITY_DISTINCT_PALETTE_DARK
    : OTHER_CITY_DISTINCT_PALETTE;
}

function applyThemeMode(nextMode, { persist = true, rerender = true } = {}) {
  const mode = normalizeThemeMode(nextMode);
  if (document.body) {
    document.body.dataset.theme = mode;
    document.body.classList.toggle("theme-dark", mode === THEME_MODE_DARK);
  }
  if (themeModeEl && themeModeEl.value !== mode) {
    themeModeEl.value = mode;
  }
  if (persist) {
    try {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    } catch (error) {
      // ignore storage failure
    }
  }
  if (rerender && raw) {
    render();
  }
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

function isUsableSourceData(data) {
  return Boolean(
    data &&
      Array.isArray(data.dates) &&
      data.dates.length > 0 &&
      Array.isArray(data.cities) &&
      data.cities.length > 0 &&
      data.values &&
      typeof data.values === "object",
  );
}

function listAvailableSources() {
  return SOURCE_CONFIGS.filter((source) => isUsableSourceData(source.data));
}

function findSourceByKey(sourceKey) {
  const available = listAvailableSources();
  const matched = available.find((source) => source.key === sourceKey);
  return matched || available[0] || null;
}

function populateSourceSelector(availableSources) {
  if (!dataSourceEl) return;
  populateSelectOptions(
    dataSourceEl,
    availableSources.map((source) => ({
      value: source.key,
      label: source.label,
    })),
  );
  dataSourceEl.disabled = availableSources.length <= 1;
}

function buildCityMaps() {
  cityById.clear();
  cityValidRanges.clear();
  raw.cities.forEach((city) => {
    cityById.set(city.id, city);
    cityValidRanges.set(city.id, getSeriesValidRange(city.id, city.availableRange));
  });
}

function normalizeCitySearchKeyword(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[·•・.。]/g, "");
}

function simplifyProvinceName(value = "") {
  const rawText = String(value || "").trim();
  if (!rawText) return "";
  return rawText
    .replace(/特别行政区/g, "")
    .replace(/(壮族自治区|回族自治区|维吾尔自治区|自治区)$/g, "")
    .replace(/(省|市)$/g, "")
    .replace(/壮族|回族|维吾尔/g, "")
    .trim();
}

function getCityRegCode(city) {
  const regCode = String(city?.regCode || "").trim();
  if (/^\d{6}$/.test(regCode)) return regCode;
  const cityId = String(city?.id || "").trim();
  const matched = cityId.match(/city_nbs_(\d{6})/);
  return matched ? matched[1] : "";
}

function getProvinceAliasesByCode(provinceCode) {
  const code = String(provinceCode || "").trim();
  if (!code) return [];
  const aliasSet = new Set();
  const baseName = PROVINCE_NAME_BY_CODE[code];
  const extraAliases = PROVINCE_EXTRA_ALIASES[code] || [];
  const pushAlias = (value) => {
    const text = String(value || "").trim();
    if (!text) return;
    aliasSet.add(text);
    const simplified = simplifyProvinceName(text);
    if (simplified) aliasSet.add(simplified);
  };
  pushAlias(baseName);
  extraAliases.forEach(pushAlias);
  return [...aliasSet];
}

function buildCitySearchTokens(city) {
  const cityTokenSet = new Set();
  const provinceTokenSet = new Set();
  const pushCityToken = (value) => {
    const token = normalizeCitySearchKeyword(value);
    if (token) cityTokenSet.add(token);
  };
  const pushProvinceToken = (value) => {
    const token = normalizeCitySearchKeyword(value);
    if (token) provinceTokenSet.add(token);
  };

  const cityName = String(city?.name || "").trim();
  pushCityToken(cityName);
  if (cityName.endsWith("市")) {
    pushCityToken(cityName.slice(0, -1));
  }

  const regCode = getCityRegCode(city);
  const provinceCode = regCode.slice(0, 2);
  const provinceAliases = getProvinceAliasesByCode(provinceCode);
  provinceAliases.forEach(pushProvinceToken);

  return {
    cityTokens: [...cityTokenSet],
    provinceTokens: [...provinceTokenSet],
  };
}

function applyCitySearchFilter() {
  const labels = [...cityListEl.querySelectorAll(".city-item")];
  const totalCount = labels.length;
  const isNbsSource = activeSourceMeta?.key === "nbs70";
  const keywordRaw = citySearchInputEl ? citySearchInputEl.value : "";
  const keyword = isNbsSource ? normalizeCitySearchKeyword(keywordRaw) : "";
  let visibleCount = 0;

  labels.forEach((label) => {
    const cityTokens = String(label.dataset.citySearchTokens || label.dataset.searchTokens || "")
      .split("|")
      .filter((token) => Boolean(token));
    const provinceTokens = String(label.dataset.provinceSearchTokens || "")
      .split("|")
      .filter((token) => Boolean(token));
    const cityMatched = cityTokens.some((token) => token.includes(keyword));
    const provinceMatched = provinceTokens.includes(keyword);
    const matched = !keyword || cityMatched || provinceMatched;
    label.classList.toggle("city-item-hidden", !matched);
    if (matched) visibleCount += 1;
  });

  if (citySearchHintEl) {
    if (!isNbsSource) {
      citySearchHintEl.textContent = "";
    } else if (!keyword) {
      citySearchHintEl.textContent = `可搜索城市名；按省份筛选需输入省份全称（如 江西、广西），当前 ${totalCount} 个城市。`;
    } else if (visibleCount === 0) {
      citySearchHintEl.textContent = `未找到“${String(keywordRaw || "").trim()}”相关城市，可试试省份名。`;
    } else {
      citySearchHintEl.textContent = `匹配到 ${visibleCount} / ${totalCount} 个城市。`;
    }
  }
}

function syncCitySearchUiForSource(isNbsSource) {
  if (citySearchWrapEl) {
    citySearchWrapEl.classList.toggle("is-hidden", !isNbsSource);
  }
  if (citySearchInputEl) {
    citySearchInputEl.disabled = !isNbsSource;
    if (!isNbsSource) {
      citySearchInputEl.value = "";
    }
  }
  if (!isNbsSource) {
    cityListEl.querySelectorAll(".city-item-hidden").forEach((label) => {
      label.classList.remove("city-item-hidden");
    });
    if (citySearchHintEl) {
      citySearchHintEl.textContent = "";
    }
  }
}

function collectCityCheckboxInputs({ visibleOnly = false } = {}) {
  const allInputs = [...cityListEl.querySelectorAll('input[type="checkbox"]')].filter(
    (input) => input instanceof HTMLInputElement,
  );
  if (!visibleOnly) return allInputs;
  return allInputs.filter((input) => {
    const label = input.closest(".city-item");
    return !(label instanceof HTMLElement && label.classList.contains("city-item-hidden"));
  });
}

function buildSourceSubtitle(source) {
  const baseText = String(source?.heroSubtitle || "").trim();
  if (!source || source.key !== "nbs70") return baseText;
  const dates = Array.isArray(source.data?.dates) ? source.data.dates : [];
  if (dates.length === 0) return baseText;
  const startMonth = normalizeMonthToken(dates[0]) || String(dates[0] || "");
  const endMonth = normalizeMonthToken(dates[dates.length - 1]) || String(dates[dates.length - 1] || "");
  if (!startMonth || !endMonth) return baseText;
  return `${baseText}｜数据范围：${startMonth} ~ ${endMonth}`;
}

function applyDataSource(sourceKey) {
  const source = findSourceByKey(sourceKey);
  if (!source) return false;
  const previousSelectedCityNames = raw
    ? readSelectedCityIds()
      .map((cityId) => cityById.get(cityId)?.name)
      .filter(Boolean)
    : null;

  raw = source.data;
  activeSourceMeta = source;
  if (sourceSubtitleEl) {
    sourceSubtitleEl.textContent = buildSourceSubtitle(source);
  }
  if (dataSourceEl && dataSourceEl.value !== source.key) {
    dataSourceEl.value = source.key;
  }
  const isNbsSource = source.key === "nbs70" || /统计局/.test(String(source.label || ""));
  if (cityBlockTitleEl) {
    cityBlockTitleEl.textContent =
      isNbsSource ? "城市（可选多至6个）" : "城市";
  }
  syncCitySearchUiForSource(isNbsSource);
  cityListEl.classList.add("city-list");
  cityListEl.classList.toggle(CITY_LIST_THREE_COLS_CLASS, isNbsSource);
  cityListEl.style.display = "grid";
  if (isNbsSource) {
    cityListEl.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    cityListEl.style.columnGap = "8px";
    cityListEl.style.rowGap = "6px";
  } else {
    cityListEl.style.removeProperty("grid-template-columns");
    cityListEl.style.removeProperty("column-gap");
    cityListEl.style.removeProperty("row-gap");
  }

  uiState.hiddenCityNames.clear();
  uiState.zoomStartMonth = null;
  uiState.zoomEndMonth = null;
  uiState.showDrawdownAnalysis = false;
  uiState.showChartTable = true;

  buildCityMaps();
  const currentCityNameSet = new Set(raw.cities.map((city) => city.name));
  const nextSelectedNames = Array.isArray(previousSelectedCityNames)
    ? previousSelectedCityNames.filter((name) => currentCityNameSet.has(name))
    : source.defaultSelectedNames;
  buildCityControls(raw.cities, nextSelectedNames);
  applyCitySearchFilter();
  buildMonthSelects(raw.dates);
  refreshCompareSourceControl({ keepSelection: false });
  return true;
}

function getAlternateSourcesForCompare() {
  return listAvailableSources().filter((source) => source.key !== activeSourceMeta?.key);
}

function getCompareEligibility(selectedCityIds = readSelectedCityIds()) {
  if (selectedCityIds.length !== 1) {
    return {
      eligible: false,
      cityName: null,
      reason: "仅在单选城市时可开启跨源对比",
    };
  }
  const selectedCity = cityById.get(selectedCityIds[0]);
  if (!selectedCity) {
    return {
      eligible: false,
      cityName: null,
      reason: "当前城市不存在",
    };
  }
  if (!COMPARE_CITY_WHITELIST.has(selectedCity.name)) {
    return {
      eligible: false,
      cityName: selectedCity.name,
      reason: "仅支持北上广深天津单城对比",
    };
  }
  return {
    eligible: true,
    cityName: selectedCity.name,
    reason: "",
  };
}

function refreshCompareSourceControl({ keepSelection = true } = {}) {
  if (!compareSourceEl) return;

  const previousValue = compareSourceEl.value || "none";
  const alternatives = getAlternateSourcesForCompare();
  const eligibility = getCompareEligibility();

  const options = [{ value: "none", label: "不对比" }].concat(
    alternatives.map((source) => ({
      value: source.key,
      label: source.label,
    })),
  );
  populateSelectOptions(compareSourceEl, options);

  const canEnable = eligibility.eligible && alternatives.length > 0;
  compareSourceEl.disabled = !canEnable;

  let nextValue = "none";
  if (canEnable && keepSelection && alternatives.some((source) => source.key === previousValue)) {
    nextValue = previousValue;
  }
  compareSourceEl.value = nextValue;

  if (compareHintEl) {
    if (!eligibility.eligible) {
      compareHintEl.textContent = eligibility.reason;
    } else if (!canEnable) {
      compareHintEl.textContent = "暂无可用于对比的其他数据源";
    } else if (nextValue === "none") {
      compareHintEl.textContent = `可对 ${eligibility.cityName} 开启跨源对比`;
    } else {
      const matched = alternatives.find((source) => source.key === nextValue);
      compareHintEl.textContent = `已开启 ${eligibility.cityName} 与${matched?.label || "另一数据源"}对比`;
    }
  }
}

function enforceCitySelectionLimit(lastChangedInput = null) {
  const checkedInputs = [...cityListEl.querySelectorAll('input[type="checkbox"]:checked')];
  if (checkedInputs.length <= MAX_SELECTED_CITY_COUNT) {
    syncCitySelectionCapacityUi();
    return true;
  }

  if (lastChangedInput && lastChangedInput.checked) {
    lastChangedInput.checked = false;
  } else {
    checkedInputs.slice(MAX_SELECTED_CITY_COUNT).forEach((input) => {
      input.checked = false;
    });
  }
  syncCitySelectionCapacityUi();
  return false;
}

function syncCitySelectionCapacityUi() {
  const inputList = [...cityListEl.querySelectorAll('input[type="checkbox"]')];
  const checkedCount = inputList.reduce(
    (count, input) => count + ((input instanceof HTMLInputElement && input.checked) ? 1 : 0),
    0,
  );
  const isFull = checkedCount >= MAX_SELECTED_CITY_COUNT;

  inputList.forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    const shouldDisable = isFull && !input.checked;
    input.disabled = shouldDisable;
    const label = input.closest(".city-item");
    if (label) {
      label.classList.toggle("is-selection-limit-disabled", shouldDisable);
    }
  });
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function findMonthIndexByToken(months, monthValue) {
  if (!Array.isArray(months) || months.length === 0) return -1;
  const token = normalizeMonthToken(monthValue);
  if (!token) return -1;
  for (let i = 0; i < months.length; i += 1) {
    if (normalizeMonthToken(months[i]) === token) return i;
  }
  return -1;
}

function applyTimeZoomFill(startIndex, endIndex, maxIndex) {
  if (!timeZoomFillEl) return;
  if (maxIndex <= 0) {
    timeZoomFillEl.style.left = "0%";
    timeZoomFillEl.style.right = "0%";
    return;
  }
  const startPct = clampNumber((startIndex / maxIndex) * 100, 0, 100);
  const endPct = clampNumber((endIndex / maxIndex) * 100, 0, 100);
  timeZoomFillEl.style.left = `${startPct}%`;
  timeZoomFillEl.style.right = `${Math.max(0, 100 - endPct)}%`;
}

function setTimeZoomDisabled(disabled) {
  if (!timeZoomWidgetEl || !timeZoomStartEl || !timeZoomEndEl || !timeZoomRangeTextEl) return;
  timeZoomWidgetEl.classList.toggle("is-disabled", disabled);
  timeZoomStartEl.disabled = disabled;
  timeZoomEndEl.disabled = disabled;
  if (disabled) {
    timeZoomRangeTextEl.textContent = "-";
    applyTimeZoomFill(0, 0, 0);
  }
}

function syncTimeZoomWidget(months, startMonth, endMonth) {
  if (!timeZoomWidgetEl || !timeZoomStartEl || !timeZoomEndEl || !timeZoomRangeTextEl) return;
  timeZoomMonths = Array.isArray(months) ? [...months] : [];
  if (timeZoomMonths.length === 0) {
    setTimeZoomDisabled(true);
    return;
  }

  const maxIndex = Math.max(0, timeZoomMonths.length - 1);
  timeZoomStartEl.min = "0";
  timeZoomStartEl.max = String(maxIndex);
  timeZoomEndEl.min = "0";
  timeZoomEndEl.max = String(maxIndex);
  timeZoomStartEl.step = "1";
  timeZoomEndEl.step = "1";

  let startIndex = findMonthIndexByToken(timeZoomMonths, startMonth);
  let endIndex = findMonthIndexByToken(timeZoomMonths, endMonth);
  if (startIndex < 0) startIndex = 0;
  if (endIndex < 0) endIndex = maxIndex;
  if (startIndex > endIndex) {
    startIndex = 0;
    endIndex = maxIndex;
  }

  isSyncingTimeZoomInputs = true;
  timeZoomStartEl.value = String(startIndex);
  timeZoomEndEl.value = String(endIndex);
  isSyncingTimeZoomInputs = false;

  const displayStart = timeZoomMonths[startIndex] || startMonth || "";
  const displayEnd = timeZoomMonths[endIndex] || endMonth || "";
  timeZoomRangeTextEl.textContent = `${formatMonthZh(displayStart)} - ${formatMonthZh(displayEnd)}`;
  applyTimeZoomFill(startIndex, endIndex, maxIndex);
  setTimeZoomDisabled(timeZoomMonths.length <= 1);
}

function syncTimeZoomWidgetFromMonthSelects() {
  if (!raw || !Array.isArray(raw.dates) || raw.dates.length === 0) return;
  const selectedStart = startMonthEl.value;
  const selectedEnd = endMonthEl.value;
  const startIndex = raw.dates.indexOf(selectedStart);
  const endIndex = raw.dates.indexOf(selectedEnd);
  if (startIndex < 0 || endIndex < 0 || startIndex > endIndex) {
    setTimeZoomDisabled(true);
    return;
  }
  const months = raw.dates.slice(startIndex, endIndex + 1);
  let nextStartIndex = findMonthIndexByToken(months, uiState.zoomStartMonth);
  let nextEndIndex = findMonthIndexByToken(months, uiState.zoomEndMonth);
  if (nextStartIndex < 0) nextStartIndex = 0;
  if (nextEndIndex < 0) nextEndIndex = months.length - 1;
  if (nextStartIndex > nextEndIndex) {
    nextStartIndex = 0;
    nextEndIndex = months.length - 1;
  }

  const nextStart = months[nextStartIndex];
  const nextEnd = months[nextEndIndex];
  uiState.zoomStartMonth = normalizeMonthToken(nextStart) || nextStart;
  uiState.zoomEndMonth = normalizeMonthToken(nextEnd) || nextEnd;
  syncTimeZoomWidget(months, nextStart, nextEnd);
}

function scheduleRenderFromTimeZoom() {
  if (timeZoomRenderFrame) {
    return;
  }
  timeZoomRenderFrame = requestAnimationFrame(() => {
    timeZoomRenderFrame = null;
    if (isSyncingRangeFromSlider) {
      return;
    }
    isSyncingRangeFromSlider = true;
    try {
      render();
    } finally {
      isSyncingRangeFromSlider = false;
    }
  });
}

function applyTimeZoomFromInputs(activeHandle) {
  if (
    isSyncingTimeZoomInputs ||
    !timeZoomStartEl ||
    !timeZoomEndEl ||
    !Array.isArray(timeZoomMonths) ||
    timeZoomMonths.length === 0
  ) {
    return;
  }

  const maxIndex = Math.max(0, timeZoomMonths.length - 1);
  let startIndex = Math.round(clampNumber(Number(timeZoomStartEl.value), 0, maxIndex));
  let endIndex = Math.round(clampNumber(Number(timeZoomEndEl.value), 0, maxIndex));

  if (startIndex > endIndex) {
    if (activeHandle === "start") {
      endIndex = startIndex;
    } else {
      startIndex = endIndex;
    }
  }

  isSyncingTimeZoomInputs = true;
  timeZoomStartEl.value = String(startIndex);
  timeZoomEndEl.value = String(endIndex);
  isSyncingTimeZoomInputs = false;

  const nextStartMonth = timeZoomMonths[startIndex];
  const nextEndMonth = timeZoomMonths[endIndex];
  if (!nextStartMonth || !nextEndMonth) return;

  timeZoomRangeTextEl.textContent = `${formatMonthZh(nextStartMonth)} - ${formatMonthZh(nextEndMonth)}`;
  applyTimeZoomFill(startIndex, endIndex, maxIndex);

  const normalizedStart = normalizeMonthToken(nextStartMonth) || nextStartMonth;
  const normalizedEnd = normalizeMonthToken(nextEndMonth) || nextEndMonth;
  if (uiState.zoomStartMonth === normalizedStart && uiState.zoomEndMonth === normalizedEnd) {
    return;
  }
  uiState.zoomStartMonth = normalizedStart;
  uiState.zoomEndMonth = normalizedEnd;
  scheduleRenderFromTimeZoom();
}

function isTouchPortraitViewport() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(hover: none) and (pointer: coarse) and (orientation: portrait)").matches;
}

function resolveResponsiveTier(responsiveWidth) {
  if (responsiveWidth <= RESPONSIVE_BREAKPOINTS.compact) return "compact";
  if (responsiveWidth <= RESPONSIVE_BREAKPOINTS.medium) return "medium";
  if (responsiveWidth <= RESPONSIVE_BREAKPOINTS.large) return "large";
  return "default";
}

function resolveResponsiveGridLayoutPreset(responsiveWidth) {
  const tier = resolveResponsiveTier(responsiveWidth);
  return RESPONSIVE_GRID_LAYOUTS[tier] || CHART_GRID_LAYOUT;
}

function resolveResponsiveChartLayoutPreset(responsiveWidth) {
  const tier = resolveResponsiveTier(responsiveWidth);
  const preset = RESPONSIVE_CHART_LAYOUTS[tier];
  if (preset) return preset;
  return {
    aspectRatio: CHART_LAYOUT_ASPECT_RATIO,
    minHeight: CHART_LAYOUT_MIN_HEIGHT,
    maxHeight: CHART_LAYOUT_MAX_HEIGHT,
    overlayScaleMin: OVERLAY_SCALE_MIN,
    overlayScaleMax: OVERLAY_SCALE_MAX,
    overlayLeftRatio: OVERLAY_LEFT_RATIO,
    overlayTopRatio: OVERLAY_TOP_RATIO,
  };
}

function resolveResponsiveXAxisPreset(responsiveWidth) {
  const tier = resolveResponsiveTier(responsiveWidth);
  return RESPONSIVE_XAXIS_PRESETS[tier] || RESPONSIVE_XAXIS_PRESETS.default;
}

function resolveResponsiveOverlaySafeGap(responsiveWidth) {
  const tier = resolveResponsiveTier(responsiveWidth);
  if (tier === "compact") return RESPONSIVE_OVERLAY_SAFE_GAPS.compact;
  if (tier === "medium") return RESPONSIVE_OVERLAY_SAFE_GAPS.medium;
  return RESPONSIVE_OVERLAY_SAFE_GAPS.default;
}

function getResponsiveChartWidth(chartWidth) {
  if (isTouchPortraitViewport()) {
    return Math.min(chartWidth, RESPONSIVE_BREAKPOINTS.medium);
  }
  return chartWidth;
}

function resolveChartGridLayout(chartWidth) {
  const responsiveWidth = getResponsiveChartWidth(chartWidth);
  return resolveResponsiveGridLayoutPreset(responsiveWidth);
}

function resolveResponsiveChartLayout(chartWidth) {
  const responsiveWidth = getResponsiveChartWidth(chartWidth);
  return resolveResponsiveChartLayoutPreset(responsiveWidth);
}

function resolveXAxisLabelLayout(months, chartWidth, visibleStartIndex, visibleEndIndex) {
  const responsiveWidth = getResponsiveChartWidth(chartWidth);
  const gridLayout = resolveChartGridLayout(chartWidth);
  const safeStart = clampNumber(
    Number.isInteger(visibleStartIndex) ? visibleStartIndex : 0,
    0,
    Math.max(0, months.length - 1),
  );
  const safeEnd = clampNumber(
    Number.isInteger(visibleEndIndex) ? visibleEndIndex : safeStart,
    safeStart,
    Math.max(0, months.length - 1),
  );
  const span = Math.max(0, safeEnd - safeStart);

  const xAxisPreset = resolveResponsiveXAxisPreset(responsiveWidth);
  const maxLabels = xAxisPreset.maxLabels;
  const fontSize = xAxisPreset.fontSize;
  const margin = xAxisPreset.margin;

  const plotWidth = Math.max(220, chartWidth - gridLayout.left - gridLayout.right);
  const minGapPx = xAxisPreset.minGapPx;
  const maxByGap = Math.max(2, Math.floor(plotWidth / minGapPx) + 1);
  const targetLabelCount = Math.max(2, Math.min(maxLabels, maxByGap, span + 1));

  const sampledIndexes = new Set();
  if (span === 0) {
    sampledIndexes.add(safeStart);
  } else {
    for (let i = 0; i < targetLabelCount; i += 1) {
      const ratio = targetLabelCount === 1 ? 0 : i / (targetLabelCount - 1);
      const index = Math.round(safeStart + span * ratio);
      sampledIndexes.add(clampNumber(index, safeStart, safeEnd));
    }
    sampledIndexes.add(safeStart);
    sampledIndexes.add(safeEnd);
  }

  let normalizedIndexes = Array.from(sampledIndexes)
    .filter((index) => Number.isInteger(index))
    .sort((a, b) => a - b);

  if (normalizedIndexes.length > 1 && span > 0) {
    const pxPerMonth = plotWidth / span;
    const minGapMonths = Math.max(1, Math.ceil(minGapPx / Math.max(pxPerMonth, 0.0001)));
    const filtered = [];
    for (const index of normalizedIndexes) {
      if (filtered.length === 0) {
        filtered.push(index);
        continue;
      }
      const prev = filtered[filtered.length - 1];
      if (index - prev >= minGapMonths) {
        filtered.push(index);
      }
    }
    if (filtered.length === 1 && safeEnd !== safeStart) {
      filtered.push(safeEnd);
    } else if (filtered.length > 1 && filtered[filtered.length - 1] !== safeEnd) {
      const last = filtered[filtered.length - 1];
      if (safeEnd - last < minGapMonths && filtered.length >= 2) {
        filtered[filtered.length - 1] = safeEnd;
      } else {
        filtered.push(safeEnd);
      }
    }
    normalizedIndexes = Array.from(new Set(filtered)).sort((a, b) => a - b);
  }

  const finalVisibleIndexes = new Set(normalizedIndexes);

  const visibleValues = new Set();
  finalVisibleIndexes.forEach((index) => {
    const value = months[index];
    if (typeof value === "string" && value) {
      visibleValues.add(value);
    }
  });

  return {
    margin,
    rotate: 0,
    fontSize,
    formatLabel(value) {
      const text = normalizeMonthToken(value);
      if (!text) return "";
      return text;
    },
    isLabelVisible(value, index) {
      const normalizedValue = normalizeMonthToken(value);
      if (normalizedValue && visibleValues.has(normalizedValue)) {
        return true;
      }
      if (!normalizedValue && Number.isInteger(index) && finalVisibleIndexes.has(index)) {
        return true;
      }
      return false;
    },
  };
}

function syncChartViewport({ resizeChart = true } = {}) {
  const chartWidth = chartEl.clientWidth;
  if (!chartWidth) return;
  const responsiveWidth = getResponsiveChartWidth(chartWidth);
  const gridLayout = resolveChartGridLayout(chartWidth);
  const layout = resolveResponsiveChartLayout(chartWidth);

  const chartHeight = Math.round(
    clampNumber(
      chartWidth * layout.aspectRatio,
      layout.minHeight,
      layout.maxHeight,
    ),
  );
  chartEl.style.height = `${chartHeight}px`;

  const overlayScaleRaw = clampNumber(
    chartWidth / CHART_LAYOUT_BASE_WIDTH,
    layout.overlayScaleMin,
    layout.overlayScaleMax,
  );
  const overlayScale = Math.round(overlayScaleRaw * 100) / 100;
  const preferredLeft = Math.round(chartWidth * layout.overlayLeftRatio);
  const preferredTop = Math.round(chartHeight * layout.overlayTopRatio);
  chartStatsOverlayEl.style.transform = `scale(${overlayScale})`;

  const rawOverlayWidth = Number(chartStatsOverlayEl.offsetWidth) || 0;
  const rawOverlayHeight = Number(chartStatsOverlayEl.offsetHeight) || 0;
  const scaledOverlayWidth = rawOverlayWidth * overlayScale;
  const scaledOverlayHeight = rawOverlayHeight * overlayScale;

  const maxLeft = Math.max(8, chartWidth - scaledOverlayWidth - 8);
  const overlaySafeGap = resolveResponsiveOverlaySafeGap(responsiveWidth);
  const requestedMinLeft = gridLayout.left + overlaySafeGap;
  const minLeft = Math.min(requestedMinLeft, maxLeft);
  const finalLeft =
    scaledOverlayWidth > 0
      ? Math.round(clampNumber(preferredLeft, minLeft, maxLeft))
      : preferredLeft;

  const minTop = 8;
  const maxTop = Math.max(minTop, chartHeight - scaledOverlayHeight - 8);
  const finalTop =
    scaledOverlayHeight > 0
      ? Math.round(clampNumber(preferredTop, minTop, maxTop))
      : preferredTop;

  chartStatsOverlayEl.style.left = `${finalLeft}px`;
  chartStatsOverlayEl.style.top = `${finalTop}px`;

  if (resizeChart) {
    chart.resize();
  }
}

function bindChartWheelToPageScroll() {
  chartEl.addEventListener(
    "wheel",
    (event) => {
      const delta = Number(event.deltaY);
      if (!Number.isFinite(delta) || delta === 0) return;
      window.scrollBy({ top: delta, left: 0, behavior: "auto" });
      event.preventDefault();
      event.stopPropagation();
    },
    { passive: false, capture: true },
  );
}

function toggleCityVisibility(cityName) {
  if (!cityName) return;
  if (uiState.hiddenCityNames.has(cityName)) {
    uiState.hiddenCityNames.delete(cityName);
  } else {
    uiState.hiddenCityNames.add(cityName);
  }
}

function readSelectedCityIds() {
  return [...cityListEl.querySelectorAll('input[type="checkbox"]:checked')].map((el) => el.value);
}

function parseRangeText(text) {
  const match = String(text || "").match(/(\d{4}-\d{2}).*?(\d{4}-\d{2})/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

function getSeriesValidRange(cityId, fallbackText = "") {
  const series = raw.values?.[cityId];
  if (Array.isArray(series) && series.length > 0) {
    let startIndex = -1;
    let endIndex = -1;
    for (let i = 0; i < series.length; i += 1) {
      if (isFiniteNumber(series[i])) {
        startIndex = i;
        break;
      }
    }
    for (let i = series.length - 1; i >= 0; i -= 1) {
      if (isFiniteNumber(series[i])) {
        endIndex = i;
        break;
      }
    }
    if (startIndex >= 0 && endIndex >= 0 && startIndex <= endIndex) {
      return {
        startIndex,
        endIndex,
        startMonth: raw.dates[startIndex],
        endMonth: raw.dates[endIndex],
      };
    }
  }

  const fallback = parseRangeText(fallbackText);
  if (!fallback) return null;
  const startIndex = raw.dates.indexOf(fallback.start);
  const endIndex = raw.dates.indexOf(fallback.end);
  if (startIndex < 0 || endIndex < 0 || startIndex > endIndex) return null;
  return {
    startIndex,
    endIndex,
    startMonth: fallback.start,
    endMonth: fallback.end,
  };
}

function getSelectedEffectiveRange(selectedCityIds) {
  let startIndex = -1;
  let endIndex = Number.POSITIVE_INFINITY;

  for (const cityId of selectedCityIds) {
    const range = cityValidRanges.get(cityId);
    if (!range) continue;
    startIndex = Math.max(startIndex, range.startIndex);
    endIndex = Math.min(endIndex, range.endIndex);
  }

  if (startIndex < 0 || !Number.isFinite(endIndex) || startIndex > endIndex) return null;
  return {
    startIndex,
    endIndex,
    startMonth: raw.dates[startIndex],
    endMonth: raw.dates[endIndex],
  };
}

function buildCityControls(cities, defaultSelectedNames = null) {
  cityListEl.innerHTML = "";
  const preferredNameSet =
    Array.isArray(defaultSelectedNames)
      ? new Set(defaultSelectedNames)
      : null;
  const orderedCities = [...cities].sort((a, b) => {
    const aRank = OVERLAY_CITY_ORDER_INDEX.has(a.name)
      ? OVERLAY_CITY_ORDER_INDEX.get(a.name)
      : Number.MAX_SAFE_INTEGER;
    const bRank = OVERLAY_CITY_ORDER_INDEX.has(b.name)
      ? OVERLAY_CITY_ORDER_INDEX.get(b.name)
      : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.name.localeCompare(b.name, "zh-CN");
  });

  for (const city of orderedCities) {
    const label = document.createElement("label");
    label.className = "city-item";
    const searchTokens = buildCitySearchTokens(city);
    if (searchTokens.cityTokens.length > 0) {
      label.dataset.citySearchTokens = searchTokens.cityTokens.join("|");
      label.dataset.searchTokens = searchTokens.cityTokens.join("|");
    }
    if (searchTokens.provinceTokens.length > 0) {
      label.dataset.provinceSearchTokens = searchTokens.provinceTokens.join("|");
    }
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = city.id;
    input.checked = preferredNameSet ? preferredNameSet.has(city.name) : true;
    const text = document.createElement("span");
    text.textContent = city.name;
    label.append(input, text);
    cityListEl.appendChild(label);
  }
  syncCitySelectionCapacityUi();
}

function buildMonthSelects(dates) {
  const options = dates.map((month) => ({
    value: month,
    label: month,
  }));
  populateSelectOptions(startMonthEl, options);
  populateSelectOptions(endMonthEl, options);

  const isNbsSource = activeSourceMeta?.key === "nbs70";
  const defaultStart = isNbsSource
    ? dates[0]
    : (dates.includes("2008-01") ? "2008-01" : dates[0]);
  const defaultEnd = dates.includes("2026-01") ? "2026-01" : dates[dates.length - 1];
  startMonthEl.value = defaultStart;
  endMonthEl.value = defaultEnd;
  syncTimeZoomWidgetFromMonthSelects();
}

function hashTextSeed(text = "") {
  const safeText = String(text);
  let hash = 0;
  for (let i = 0; i < safeText.length; i += 1) {
    hash = (hash * 131 + safeText.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function hexToRgb(hexColor) {
  const rawHex = String(hexColor || "").trim().replace(/^#/, "");
  if (!(rawHex.length === 3 || rawHex.length === 6)) return null;
  const normalizedHex =
    rawHex.length === 3
      ? rawHex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : rawHex;
  const parsed = Number.parseInt(normalizedHex, 16);
  if (!Number.isFinite(parsed)) return null;
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function rgbToHsl(rgb) {
  if (!rgb) return null;
  const r = clampNumber((Number(rgb.r) || 0) / 255, 0, 1);
  const g = clampNumber((Number(rgb.g) || 0) / 255, 0, 1);
  const b = clampNumber((Number(rgb.b) || 0) / 255, 0, 1);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) {
    return {
      h: 0,
      s: 0,
      l: l * 100,
    };
  }
  const delta = max - min;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      break;
    case g:
      h = ((b - r) / delta + 2) * 60;
      break;
    default:
      h = ((r - g) / delta + 4) * 60;
      break;
  }
  return {
    h: (h + 360) % 360,
    s: s * 100,
    l: l * 100,
  };
}

function parseColorToHsl(color) {
  const text = String(color || "").trim();
  if (!text) return null;
  if (text.startsWith("#")) {
    return rgbToHsl(hexToRgb(text));
  }
  const hslMatch = text.match(
    /^hsl\(\s*(-?\d+(?:\.\d+)?)\s*(?:deg)?\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)$/i,
  );
  if (!hslMatch) return null;
  return {
    h: ((Number(hslMatch[1]) % 360) + 360) % 360,
    s: clampNumber(Number(hslMatch[2]), 0, 100),
    l: clampNumber(Number(hslMatch[3]), 0, 100),
  };
}

function calcHslDistance(a, b) {
  if (!a || !b) return 0;
  const hueDeltaRaw = Math.abs(a.h - b.h);
  const hueDelta = Math.min(hueDeltaRaw, 360 - hueDeltaRaw) / 180;
  const satDelta = Math.abs(a.s - b.s) / 100;
  const lightDelta = Math.abs(a.l - b.l) / 100;
  return hueDelta * 0.72 + satDelta * 0.2 + lightDelta * 0.08;
}

function getMinColorDistance(color, usedColors) {
  if (!Array.isArray(usedColors) || usedColors.length === 0) return 1;
  const target = parseColorToHsl(color);
  if (!target) return 1;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const usedColor of usedColors) {
    const compared = parseColorToHsl(usedColor);
    if (!compared) continue;
    minDistance = Math.min(minDistance, calcHslDistance(target, compared));
  }
  return Number.isFinite(minDistance) ? minDistance : 1;
}

function colorFromCityName(cityName = "", index = 0, themeMode = getCurrentThemeMode()) {
  const normalizedTheme = normalizeThemeMode(themeMode);
  const seed = hashTextSeed(cityName) + index * 67;
  const hue = (seed * 37) % 360;
  const saturation = normalizedTheme === THEME_MODE_DARK ? 84 : 74;
  const lightness = normalizedTheme === THEME_MODE_DARK ? 66 : 44;
  return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness}%)`;
}

function pickDistinctCityColor(cityName, index, usedColors, themeMode = getCurrentThemeMode()) {
  const normalizedTheme = normalizeThemeMode(themeMode);
  const palette = getThemeCityPalette(normalizedTheme);
  const seed = hashTextSeed(cityName);
  const paletteSize = palette.length;
  const candidates = [];

  if (paletteSize > 0) {
    const startOffset = seed % paletteSize;
    for (let i = 0; i < paletteSize; i += 1) {
      candidates.push(palette[(startOffset + i) % paletteSize]);
    }
  }
  for (let i = 0; i < 36; i += 1) {
    candidates.push(colorFromCityName(cityName, index + i * 2, normalizedTheme));
  }

  const distinctThreshold = 0.235;
  let bestColor = candidates[0] || colorFromCityName(cityName, index, normalizedTheme);
  let bestScore = getMinColorDistance(bestColor, usedColors);
  for (const candidate of candidates) {
    const score = getMinColorDistance(candidate, usedColors);
    if (score > bestScore) {
      bestScore = score;
      bestColor = candidate;
    }
    if (score >= distinctThreshold) {
      return candidate;
    }
  }
  return bestColor;
}

function buildSelectedCityColorMap(cityNames, themeMode = getCurrentThemeMode()) {
  const normalizedTheme = normalizeThemeMode(themeMode);
  const corePalette = getThemeCoreCityPalette(normalizedTheme);
  const orderedNames = [];
  const seen = new Set();
  for (const cityName of cityNames || []) {
    const text = String(cityName || "");
    if (!text || seen.has(text)) continue;
    seen.add(text);
    orderedNames.push(text);
  }

  const colorMap = new Map();
  const usedColors = [];
  for (const cityName of orderedNames) {
    const fixedColor = corePalette[cityName];
    if (!fixedColor) continue;
    colorMap.set(cityName, fixedColor);
    usedColors.push(fixedColor);
  }

  let nonCoreIndex = 0;
  for (const cityName of orderedNames) {
    if (colorMap.has(cityName)) continue;
    const pickedColor = pickDistinctCityColor(cityName, nonCoreIndex, usedColors, normalizedTheme);
    colorMap.set(cityName, pickedColor);
    usedColors.push(pickedColor);
    nonCoreIndex += 1;
  }
  return colorMap;
}

function getColor(cityName, index, selectedColorMap = null) {
  const corePalette = getThemeCoreCityPalette();
  if (corePalette[cityName]) return corePalette[cityName];
  if (selectedColorMap instanceof Map && selectedColorMap.has(cityName)) {
    return selectedColorMap.get(cityName);
  }
  return pickDistinctCityColor(cityName, index, Object.values(corePalette), getCurrentThemeMode());
}

function getLastFiniteInfo(values, dates) {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    if (isFiniteNumber(values[i])) {
      return { value: values[i], date: dates[i] };
    }
  }
  return { value: null, date: null };
}

function getLastFiniteIndex(values) {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    if (isFiniteNumber(values[i])) return i;
  }
  return -1;
}

function alignSeriesByMonths(dataset, series, months) {
  const monthToValue = new Map();
  dataset.dates.forEach((month, index) => {
    monthToValue.set(month, series[index]);
  });
  return months.map((month) => {
    const value = monthToValue.get(month);
    return isFiniteNumber(value) ? value : null;
  });
}

function buildAnchoredCompareSeries(
  compareSeriesByMonths,
  targetNormalizedSeries,
  months,
  preferredAnchorMonth = "2008-01",
) {
  if (
    !Array.isArray(compareSeriesByMonths) ||
    !Array.isArray(targetNormalizedSeries) ||
    !Array.isArray(months) ||
    compareSeriesByMonths.length !== targetNormalizedSeries.length ||
    compareSeriesByMonths.length !== months.length
  ) {
    return null;
  }

  const canUseAnchorIndex = (index) => (
    Number.isInteger(index) &&
    index >= 0 &&
    index < compareSeriesByMonths.length &&
    isFiniteNumber(compareSeriesByMonths[index]) &&
    compareSeriesByMonths[index] > 0 &&
    isFiniteNumber(targetNormalizedSeries[index])
  );

  let anchorIndex = findMonthIndexByToken(months, preferredAnchorMonth);
  if (!canUseAnchorIndex(anchorIndex)) {
    anchorIndex = -1;
    for (let i = 0; i < compareSeriesByMonths.length; i += 1) {
      if (canUseAnchorIndex(i)) {
        anchorIndex = i;
        break;
      }
    }
  }

  if (!canUseAnchorIndex(anchorIndex)) return null;

  const compareAnchorRaw = compareSeriesByMonths[anchorIndex];
  const targetAnchorValue = targetNormalizedSeries[anchorIndex];
  if (!isFiniteNumber(compareAnchorRaw) || compareAnchorRaw <= 0 || !isFiniteNumber(targetAnchorValue)) {
    return null;
  }

  const normalized = compareSeriesByMonths.map((value) => {
    if (!isFiniteNumber(value)) return null;
    return (value / compareAnchorRaw) * targetAnchorValue;
  });

  return {
    normalized,
    anchorIndex,
    anchorMonth: months[anchorIndex],
    targetAnchorValue,
    compareAnchorRaw,
  };
}

function resolveCompareContext(selectedCityIds) {
  if (!compareSourceEl) return null;

  const compareSourceKey = compareSourceEl.value;
  if (!compareSourceKey || compareSourceKey === "none") return null;

  const eligibility = getCompareEligibility(selectedCityIds);
  if (!eligibility.eligible) return null;

  const compareSource = findSourceByKey(compareSourceKey);
  if (!compareSource || compareSource.key === activeSourceMeta?.key) return null;

  const compareCity = compareSource.data?.cities?.find((city) => city.name === eligibility.cityName);
  if (!compareCity) return null;

  return {
    cityName: eligibility.cityName,
    source: compareSource,
    city: compareCity,
  };
}

function calcPctChange(currentValue, baseValue) {
  if (!isFiniteNumber(currentValue) || !isFiniteNumber(baseValue) || baseValue === 0) return null;
  return ((currentValue / baseValue) - 1) * 100;
}

function findRecoverIndex(values, latestValue, historyEndIndex) {
  if (!Array.isArray(values) || !isFiniteNumber(latestValue)) return -1;
  if (!Number.isInteger(historyEndIndex) || historyEndIndex < 0) return -1;

  const safeEndIndex = Math.min(historyEndIndex, values.length - 1);
  const exactTolerance = Math.max(Math.abs(latestValue) * 0.00025, 0.01);
  let firstFiniteIndex = -1;
  let prevIndex = -1;
  let prevValue = null;

  for (let i = 0; i <= safeEndIndex; i += 1) {
    const currValue = values[i];
    if (!isFiniteNumber(currValue)) continue;

    if (firstFiniteIndex < 0) {
      firstFiniteIndex = i;
      if (currValue >= latestValue || Math.abs(currValue - latestValue) <= exactTolerance) {
        return i;
      }
      prevIndex = i;
      prevValue = currValue;
      continue;
    }

    if (Math.abs(currValue - latestValue) <= exactTolerance) {
      return i;
    }

    if (isFiniteNumber(prevValue) && prevValue < latestValue && currValue >= latestValue) {
      const prevDiff = Math.abs(prevValue - latestValue);
      const currDiff = Math.abs(currValue - latestValue);
      return prevDiff <= currDiff ? prevIndex : i;
    }

    prevIndex = i;
    prevValue = currValue;
  }

  if (firstFiniteIndex < 0) return -1;

  let nearestIndex = -1;
  let nearestDiff = Number.POSITIVE_INFINITY;
  for (let i = firstFiniteIndex; i <= safeEndIndex; i += 1) {
    const value = values[i];
    if (!isFiniteNumber(value)) continue;
    const diff = Math.abs(value - latestValue);
    if (diff < nearestDiff) {
      nearestDiff = diff;
      nearestIndex = i;
    }
  }
  return nearestIndex;
}

function getOverlayColumnRatios(isCrossSource) {
  return isCrossSource
    ? [0.31, 0.175, 0.17, 0.17, 0.175]
    : [0.25, 0.19, 0.19, 0.19, 0.18];
}

function decorateDrawdownForViewport(
  drawdown,
  normalizedAll,
  monthsAll,
  viewportStartOffset,
  viewportEndOffset,
) {
  if (!drawdown) return null;

  const toGlobalIndex = (localIndex) => localIndex + viewportStartOffset;
  const peakGlobalIndex = toGlobalIndex(drawdown.peakIndex);
  const latestGlobalIndex = toGlobalIndex(drawdown.latestIndex);

  let recoverGlobalIndex = findRecoverIndex(
    normalizedAll,
    drawdown.latestValue,
    Math.max(0, latestGlobalIndex - 1),
  );
  if (!Number.isInteger(recoverGlobalIndex) || recoverGlobalIndex < 0) {
    recoverGlobalIndex = toGlobalIndex(drawdown.recoverIndex);
  }

  const visibleStart = clampNumber(viewportStartOffset, 0, monthsAll.length - 1);
  const visibleEnd = clampNumber(viewportEndOffset, visibleStart, monthsAll.length - 1);
  const latestVisibleIndex = clampNumber(latestGlobalIndex, visibleStart, visibleEnd);
  const recoverDisplayIndex = clampNumber(recoverGlobalIndex, visibleStart, latestVisibleIndex);

  const recoverMonth =
    recoverGlobalIndex >= 0 && recoverGlobalIndex < monthsAll.length
      ? monthsAll[recoverGlobalIndex]
      : drawdown.recoverMonth;
  const recoverDisplayMonth =
    monthsAll[recoverDisplayIndex] || recoverMonth || drawdown.recoverMonth;
  const midIndex = Math.round((recoverDisplayIndex + latestVisibleIndex) / 2);

  return {
    ...drawdown,
    peakIndex: peakGlobalIndex,
    peakMonth: monthsAll[peakGlobalIndex] || drawdown.peakMonth,
    latestIndex: latestGlobalIndex,
    latestMonth: monthsAll[latestGlobalIndex] || drawdown.latestMonth,
    recoverIndex: recoverGlobalIndex,
    recoverMonth,
    recoverDisplayIndex,
    recoverDisplayMonth,
    recoverOutsideViewport: recoverGlobalIndex < visibleStart,
    midIndex,
    midMonth: monthsAll[midIndex] || drawdown.midMonth,
  };
}

function buildDrawdownHorizontalLayout(
  drawdown,
  {
    visibleStartIndex = 0,
    visibleEndIndex = 0,
    plotWidthPx = 1,
    halfGapPx = 22,
  } = {},
) {
  if (!drawdown) return null;
  const rawStartIndex = Number.isInteger(drawdown.recoverDisplayIndex)
    ? drawdown.recoverDisplayIndex
    : drawdown.recoverIndex;
  if (!Number.isInteger(rawStartIndex) || !Number.isInteger(drawdown.latestIndex)) return null;

  const safeVisibleStart = Math.max(0, Number.isInteger(visibleStartIndex) ? visibleStartIndex : 0);
  const safeVisibleEnd = Math.max(
    safeVisibleStart,
    Number.isInteger(visibleEndIndex) ? visibleEndIndex : safeVisibleStart,
  );
  const endIndex = Math.round(
    clampNumber(drawdown.latestIndex, safeVisibleStart, safeVisibleEnd),
  );
  if (rawStartIndex >= endIndex) return null;

  const startIndex = Math.round(
    clampNumber(rawStartIndex, safeVisibleStart, endIndex - 1),
  );
  const span = endIndex - startIndex;
  if (span < 1) return null;

  const labelCenterIndex = Math.round((startIndex + endIndex) / 2);
  const visibleSpan = Math.max(1, safeVisibleEnd - safeVisibleStart);
  const pxPerMonth = Math.max(1, plotWidthPx / visibleSpan);
  const halfGapMonthByPx = Math.max(1, Math.ceil(halfGapPx / pxPerMonth));
  const maxHalfGapByData = Math.max(1, Math.floor((span - 1) / 2));
  const halfGap = Math.min(maxHalfGapByData, halfGapMonthByPx);

  let leftBreakIndex = Math.max(startIndex, labelCenterIndex - halfGap);
  let rightBreakIndex = Math.min(endIndex, labelCenterIndex + halfGap);
  if (leftBreakIndex >= rightBreakIndex) {
    leftBreakIndex = Math.max(startIndex, labelCenterIndex - 1);
    rightBreakIndex = Math.min(endIndex, labelCenterIndex + 1);
  }

  if (leftBreakIndex <= startIndex && span >= 3) {
    leftBreakIndex = startIndex + 1;
  }
  if (rightBreakIndex >= endIndex && span >= 3) {
    rightBreakIndex = endIndex - 1;
  }

  return {
    startIndex,
    endIndex,
    labelCenterIndex,
    halfGapMonths: halfGap,
    leftBreakIndex,
    rightBreakIndex,
  };
}

function resolveHorizontalBreaksForLabel(startIndex, endIndex, labelCenterIndex, halfGapMonths) {
  let leftBreakIndex = Math.max(startIndex, labelCenterIndex - halfGapMonths);
  let rightBreakIndex = Math.min(endIndex, labelCenterIndex + halfGapMonths);
  if (leftBreakIndex >= rightBreakIndex) {
    leftBreakIndex = Math.max(startIndex, labelCenterIndex - 1);
    rightBreakIndex = Math.min(endIndex, labelCenterIndex + 1);
  }

  const span = endIndex - startIndex;
  if (leftBreakIndex <= startIndex && span >= 3) {
    leftBreakIndex = startIndex + 1;
  }
  if (rightBreakIndex >= endIndex && span >= 3) {
    rightBreakIndex = endIndex - 1;
  }

  return {
    leftBreakIndex,
    rightBreakIndex,
  };
}

function resolveRecoverLabelLayoutAvoidPeak(
  horizontalLayout,
  drawdown,
  months,
  toPixelCoord,
  peakLabelRects,
  chartBounds,
  recoverLabelBox,
  avoidRects = [],
) {
  if (
    !horizontalLayout ||
    !drawdown ||
    !Array.isArray(months) ||
    months.length === 0 ||
    typeof toPixelCoord !== "function" ||
    !Array.isArray(peakLabelRects) ||
    !recoverLabelBox
  ) {
    return horizontalLayout;
  }

  const { startIndex, endIndex, labelCenterIndex } = horizontalLayout;
  const halfGapMonths = Math.max(1, Number(horizontalLayout.halfGapMonths) || 1);
  if (
    !Number.isInteger(startIndex) ||
    !Number.isInteger(endIndex) ||
    !Number.isInteger(labelCenterIndex) ||
    startIndex >= endIndex
  ) {
    return horizontalLayout;
  }

  const candidateIndices = [labelCenterIndex];
  const maxDelta = Math.max(labelCenterIndex - startIndex, endIndex - labelCenterIndex);
  for (let delta = 1; delta <= maxDelta; delta += 1) {
    const left = labelCenterIndex - delta;
    const right = labelCenterIndex + delta;
    if (left >= startIndex) candidateIndices.push(left);
    if (right <= endIndex) candidateIndices.push(right);
  }
  if (Number.isInteger(halfGapMonths) && halfGapMonths > 1) {
    const leftJump = labelCenterIndex - halfGapMonths;
    const rightJump = labelCenterIndex + halfGapMonths;
    if (leftJump >= startIndex) candidateIndices.unshift(leftJump);
    if (rightJump <= endIndex) candidateIndices.unshift(rightJump);
  }

  function countConflicts(recoverRect) {
    if (!recoverRect) {
      return {
        peakCount: 0,
        labelCount: 0,
      };
    }
    let peakCount = 0;
    for (const peakRect of peakLabelRects) {
      if (!peakRect) continue;
      if (rectsOverlap(recoverRect, peakRect, 10)) {
        peakCount += 1;
        continue;
      }

      const recoverCenterX = recoverRect.x + recoverRect.width / 2;
      const peakCenterX = peakRect.x + peakRect.width / 2;
      const dx = Math.abs(recoverCenterX - peakCenterX);
      const recoverBottom = recoverRect.y + recoverRect.height;
      const peakBottom = peakRect.y + peakRect.height;
      const verticalGap = Math.max(
        peakRect.y - recoverBottom,
        recoverRect.y - peakBottom,
        0,
      );

      const nearX = dx <= Math.max(recoverRect.width, peakRect.width) * 0.5;
      const nearY = verticalGap <= 14;
      if (nearX && nearY) {
        peakCount += 1;
      }
    }

    let labelCount = 0;
    if (Array.isArray(avoidRects)) {
      for (const occupiedRect of avoidRects) {
        if (!occupiedRect) continue;
        if (rectsOverlap(recoverRect, occupiedRect, 5)) {
          labelCount += 1;
        }
      }
    }

    return {
      peakCount,
      labelCount,
    };
  }

  let bestCandidate = null;
  for (const candidateIndex of candidateIndices) {
    const month = months[candidateIndex];
    if (!month) continue;
    const anchor = toPixelCoord(month, drawdown.latestValue);
    if (!anchor) continue;

    const rect = buildLabelRect({
      anchorX: anchor.x,
      anchorY: anchor.y,
      width: recoverLabelBox.width + 8,
      height: recoverLabelBox.height + 6,
      position: "inside",
      offsetX: 0,
      offsetY: 0,
    });
    const conflict = countConflicts(rect);
    const overflow = calcRectOverflow(rect, chartBounds);
    const distance = Math.abs(candidateIndex - labelCenterIndex);
    const score =
      conflict.peakCount * 100000 +
      conflict.labelCount * 130000 +
      overflow * 1200 +
      distance;

    if (!bestCandidate || score < bestCandidate.score) {
      bestCandidate = {
        score,
        candidateIndex,
        peakCount: conflict.peakCount,
        labelCount: conflict.labelCount,
        overflow,
      };
    }

    if (conflict.peakCount === 0 && conflict.labelCount === 0 && overflow === 0 && distance > 0) {
      break;
    }
  }

  if (!bestCandidate || bestCandidate.candidateIndex === labelCenterIndex) {
    return horizontalLayout;
  }

  const breaks = resolveHorizontalBreaksForLabel(
    startIndex,
    endIndex,
    bestCandidate.candidateIndex,
    halfGapMonths,
  );
  return {
    ...horizontalLayout,
    labelCenterIndex: bestCandidate.candidateIndex,
    leftBreakIndex: breaks.leftBreakIndex,
    rightBreakIndex: breaks.rightBreakIndex,
  };
}

function findDrawdownAnalysis(values, months) {
  const latestIndex = getLastFiniteIndex(values);
  if (latestIndex <= 0) return null;

  const latestValue = values[latestIndex];
  let peakValue = Number.NEGATIVE_INFINITY;
  let peakIndex = -1;

  for (let i = 0; i < latestIndex; i += 1) {
    const value = values[i];
    if (!isFiniteNumber(value)) continue;
    if (value > peakValue) {
      peakValue = value;
      peakIndex = i;
    }
  }

  if (peakIndex < 0 || !isFiniteNumber(peakValue)) return null;

  const drawdownPct = calcPctChange(latestValue, peakValue);
  if (!isFiniteNumber(drawdownPct) || drawdownPct > -10) return null;

  const recoverIndex = findRecoverIndex(values, latestValue, Math.max(0, latestIndex - 1));
  if (recoverIndex < 0) return null;

  const midIndex = Math.floor((recoverIndex + latestIndex) / 2);
  return {
    peakIndex,
    peakMonth: months[peakIndex],
    peakValue,
    latestIndex,
    latestMonth: months[latestIndex],
    latestValue,
    recoverIndex,
    recoverMonth: months[recoverIndex],
    midIndex,
    midMonth: months[midIndex],
    drawdownPct,
  };
}

function updateDrawdownButton(eligibleCount) {
  const enabled = eligibleCount > 0;

  drawdownBtn.disabled = !enabled;
  drawdownBtn.classList.toggle("enabled", enabled);

  if (!enabled) {
    drawdownBtn.textContent = "累计跌幅（不可用）";
    return;
  }

  drawdownBtn.textContent = uiState.showDrawdownAnalysis
    ? "累计跌幅（开启）"
    : "累计跌幅（关闭）";
}

function updateChartTableButton(eligibleCount) {
  const enabled = eligibleCount > 0;
  if (!enabled) {
    uiState.showChartTable = false;
  }

  chartTableBtn.disabled = !enabled;
  chartTableBtn.classList.toggle("enabled", enabled);

  if (!enabled) {
    chartTableBtn.textContent = "表格汇总（不可用）";
    return;
  }

  chartTableBtn.textContent = uiState.showChartTable
    ? "表格汇总（开启）"
    : "表格汇总（关闭）";
}

function getOverlaySourceProfile(sourceKey) {
  if (typeof sourceKey === "string" && sourceKey.includes("nbs")) {
    return OVERLAY_SOURCE_PROFILES.nbs70;
  }
  return OVERLAY_SOURCE_PROFILES.centaline6;
}

function resolveOverlayPresentation(rows) {
  const sourceKeys = [
    ...new Set((rows || []).map((row) => String(row.sourceKey || "centaline6"))),
  ];
  const isCrossSource = sourceKeys.length > 1;
  const singleSourceKey = sourceKeys[0] || "centaline6";
  const headerLabel = isCrossSource
    ? "房价数据源"
    : singleSourceKey.includes("nbs")
      ? "统计局指数"
      : "中原领先指数";
  const sourceNoteText = isCrossSource
    ? [...new Set(sourceKeys.map((sourceKey) => getOverlaySourceProfile(sourceKey).sourceNote))].join("、")
    : getOverlaySourceProfile(singleSourceKey).sourceNote;
  return {
    isCrossSource,
    headerLabel,
    sourceNoteText,
  };
}

function formatOverlayCityCellHtml(row, isCrossSource) {
  const cityName = escapeHtml(row.cityName || row.name || "-");
  if (!isCrossSource || !row.sourceLabel) {
    return `<span class="chart-stats-city-main">${cityName}</span>`;
  }
  const sourceLabel = escapeHtml(row.sourceLabel);
  return `<span class="chart-stats-city-main">${cityName}<span class="chart-stats-source-tag">（${sourceLabel}）</span></span>`;
}

function renderChartStatsOverlay(rows, startMonth, endMonth) {
  if (!uiState.showChartTable || !Array.isArray(rows) || rows.length === 0) {
    chartStatsOverlayEl.classList.remove("show");
    chartStatsOverlayEl.classList.remove("is-cross-source");
    chartStatsOverlayEl.innerHTML = "";
    syncChartViewport({ resizeChart: false });
    return;
  }

  const { isCrossSource, headerLabel, sourceNoteText } = resolveOverlayPresentation(rows);
  const rangeLabel = formatOverlayRangeLabel(startMonth, endMonth);
  const rangeHtml = buildOverlayRangeHtml(startMonth, endMonth);
  const baseLabel = formatOverlayBaseLabel(startMonth);
  const baseValueHtml = buildOverlayBaseValueHtml(startMonth);
  const escapedRangeLabel = escapeHtml(rangeLabel);
  const escapedBaseLabel = escapeHtml(baseLabel);
  const escapedHeaderLabel = escapeHtml(headerLabel);
  const escapedSourceNoteText = escapeHtml(sourceNoteText);

  const orderedRows = [...rows].sort((a, b) => {
    const aCityName = String(a.cityName || a.name || "");
    const bCityName = String(b.cityName || b.name || "");
    const aRank = OVERLAY_CITY_ORDER_INDEX.has(aCityName)
      ? OVERLAY_CITY_ORDER_INDEX.get(aCityName)
      : Number.MAX_SAFE_INTEGER;
    const bRank = OVERLAY_CITY_ORDER_INDEX.has(bCityName)
      ? OVERLAY_CITY_ORDER_INDEX.get(bCityName)
      : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return aCityName.localeCompare(bCityName, "zh-CN");
  });

  const colRatios = getOverlayColumnRatios(isCrossSource);
  const colGroupHtml = `<colgroup>${colRatios
    .map((ratio) => `<col style="width:${(ratio * 100).toFixed(2)}%">`)
    .join("")}</colgroup>`;

  const bodyRows = orderedRows
    .map((row) => {
      const recoverText = row.recoverMonth
        ? escapeHtml(row.recoverMonth.replace("-", "."))
        : "-";
      const drawdownText = isFiniteNumber(row.drawdownFromPeakPct)
        ? `${Math.abs(row.drawdownFromPeakPct).toFixed(1)}%`
        : "-";
      return `<tr>
        <td>${formatOverlayCityCellHtml(row, isCrossSource)}</td>
        <td>${formatNumber(row.peakValue, 1)}</td>
        <td>${formatNumber(row.latestValue, 1)}</td>
        <td>${drawdownText}</td>
        <td>${recoverText}</td>
      </tr>`;
    })
    .join("");

  chartStatsOverlayEl.innerHTML = `
    <div class="chart-stats-title-main">二手住宅价格指数：热点城市</div>
    <div class="chart-stats-title-sub chart-stats-title-range" aria-label="${escapedRangeLabel}">${rangeHtml}</div>
    <div class="chart-stats-title-sub chart-stats-title-base" aria-label="${escapedBaseLabel}">
      <span class="chart-stats-base-prefix">定基</span><span class="chart-stats-base-value">${baseValueHtml}</span>
    </div>
    <table>
    ${colGroupHtml}
    <thead>
      <tr>
        <th><span class="chart-stats-th-text">${escapedHeaderLabel}</span></th>
        <th><span class="chart-stats-th-text">最高位置</span></th>
        <th><span class="chart-stats-th-text">当前位置</span></th>
        <th><span class="chart-stats-th-text">累计跌幅</span></th>
        <th><span class="chart-stats-th-text">跌回</span></th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="chart-stats-note">*数据来源：${escapedSourceNoteText}</div>
  <div class="chart-stats-note">*图表制作：公众号 - 一座独立屋</div>
  `;
  chartStatsOverlayEl.classList.add("show");
  chartStatsOverlayEl.classList.toggle("is-cross-source", isCrossSource);
  syncChartViewport({ resizeChart: false });
}

function renderSummaryTable(rows) {
  summaryBodyEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    const tr = document.createElement("tr");
    const cells = [
      row.name,
      formatNumber(row.baseRaw, 2),
      `${formatNumber(row.peakValue, 1)} (${row.peakDate || "-"})`,
      `${formatNumber(row.latestValue, 1)} (${row.latestDate || "-"})`,
      formatPercent(row.momPct, 1),
      formatPercent(row.yoyPct, 1),
      formatPercent(row.drawdownFromPeakPct, 1),
    ];
    cells.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = String(cell ?? "-");
      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  }
  summaryBodyEl.appendChild(fragment);
}

function downloadByDataURL(dataURL, filename) {
  const anchor = document.createElement("a");
  anchor.href = dataURL;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function loadImageByURL(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image-load-failed"));
    image.src = url;
  });
}

async function captureChartStageSnapshot(pixelRatio = 2) {
  if (!chartStageEl) return null;
  if (typeof window.html2canvas !== "function") return null;

  const stageRect = chartStageEl.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) return null;
  const chartTheme = getActiveChartThemeStyle();
  const option = chart.getOption?.() || {};
  const toolboxConfig = Array.isArray(option.toolbox) ? option.toolbox[0] : option.toolbox;
  const toolboxShow = toolboxConfig ? toolboxConfig.show !== false : false;
  const sliderDataZoom = Array.isArray(option.dataZoom)
    ? option.dataZoom.find((item) => item?.type === "slider")
    : null;
  const sliderShow = sliderDataZoom ? sliderDataZoom.show !== false : false;

  if (toolboxShow) {
    chart.setOption(
      {
        toolbox: {
          show: false,
        },
      },
      { lazyUpdate: false },
    );
  }

  if (sliderDataZoom && sliderShow) {
    chart.setOption(
      {
        dataZoom: [
          {
            type: "slider",
            show: false,
          },
        ],
      },
      { lazyUpdate: false },
    );
  }

  let stageCanvas = null;
  try {
    if (toolboxShow || (sliderDataZoom && sliderShow)) {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    stageCanvas = await window.html2canvas(chartStageEl, {
      backgroundColor: chartTheme.chartBackground,
      scale: pixelRatio,
      useCORS: true,
      logging: false,
    });
  } finally {
    if (toolboxShow) {
      chart.setOption(
        {
          toolbox: {
            show: true,
          },
        },
        { lazyUpdate: false },
      );
    }
    if (sliderDataZoom && sliderShow) {
      chart.setOption(
        {
          dataZoom: [
            {
              type: "slider",
              show: true,
            },
          ],
        },
        { lazyUpdate: false },
      );
    }
  }

  if (!stageCanvas) return null;
  return {
    dataURL: stageCanvas.toDataURL("image/png"),
  };
}

function getOverlayPseudoBoldOffset(fontSizePx) {
  const safeSize = Number.isFinite(fontSizePx) ? fontSizePx : 12;
  return Math.max(0.45, safeSize * 0.032);
}

function fillTextWithPseudoBold(ctx, text, x, y, fontSizePx, enabled = true, factor = 1) {
  const value = String(text ?? "");
  if (!enabled || !value) {
    ctx.fillText(value, x, y);
    return;
  }
  const safeFactor = Number.isFinite(Number(factor)) ? Math.max(1, Number(factor)) : 1;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.lineWidth = getOverlayPseudoBoldOffset(fontSizePx) * safeFactor;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.strokeText(value, x, y);
  ctx.restore();
  ctx.fillText(value, x, y);
}

function drawOverlaySummaryOnCanvas(ctx, canvasWidth, canvasHeight, exportContext) {
  if (!uiState.showChartTable || !exportContext) return;
  const rows = Array.isArray(exportContext.visibleSummaryRows)
    ? exportContext.visibleSummaryRows
    : [];
  if (rows.length === 0) return;

  const { isCrossSource, headerLabel, sourceNoteText } = resolveOverlayPresentation(rows);
  const rangeStartSegments = getOverlayMonthTextSegments(exportContext.startMonth);
  const rangeEndSegments = getOverlayMonthTextSegments(exportContext.endMonth);
  const baseValueSegments = [
    ...getOverlayMonthTextSegments(exportContext.startMonth),
    { text: "＝", isDigit: false },
    { text: "100", isDigit: true },
  ];

  const orderedRows = [...rows].sort((a, b) => {
    const aCityName = String(a.cityName || a.name || "");
    const bCityName = String(b.cityName || b.name || "");
    const aRank = OVERLAY_CITY_ORDER_INDEX.has(aCityName)
      ? OVERLAY_CITY_ORDER_INDEX.get(aCityName)
      : Number.MAX_SAFE_INTEGER;
    const bRank = OVERLAY_CITY_ORDER_INDEX.has(bCityName)
      ? OVERLAY_CITY_ORDER_INDEX.get(bCityName)
      : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return aCityName.localeCompare(bCityName, "zh-CN");
  });

  const chartRect = chartEl.getBoundingClientRect();
  const overlayRect = chartStatsOverlayEl.getBoundingClientRect();
  if (!chartRect.width || !chartRect.height || !overlayRect.width || !overlayRect.height) return;

  const scaleX = canvasWidth / chartRect.width;
  const scaleY = canvasHeight / chartRect.height;
  const boxX = (overlayRect.left - chartRect.left) * scaleX;
  const boxY = (overlayRect.top - chartRect.top) * scaleY;
  const boxW = overlayRect.width * scaleX;
  const tableScale = isCrossSource ? 1.275 : 1.2075;
  const tableW = boxW * tableScale;
  const tableDelta = tableW - boxW;
  const tableX = isCrossSource
    ? boxX - tableDelta * 0.35
    : boxX - tableDelta / 2;
  const centerX = tableX + tableW / 2;
  const fontFamily = CHART_FONT_FAMILY;
  const chartTheme = getActiveChartThemeStyle();

  const mainFontSize = Math.max(16, Math.round(19 * scaleY * OVERLAY_EMPHASIS_SCALE));
  const subFontSize = Math.max(12, Math.round(13 * scaleY));
  const cellFontSize = Math.max(12, Math.round(13 * scaleY * OVERLAY_TABLE_SCALE));
  const headerFontSize = Math.max(12, Math.round(cellFontSize * OVERLAY_EMPHASIS_SCALE));
  const cityFontSize = Math.max(12, Math.round(cellFontSize * OVERLAY_EMPHASIS_SCALE));
  const titleBoldFactor = 2.4;
  const headerBoldFactor = 2;
  const cityBoldFactor = 1.9;
  const noteFontSize = Math.max(10, Math.round(12 * scaleY));
  const titleColor = chartTheme.overlayTitleColor;
  const lineColor = chartTheme.overlayLineColor;

  let cursorY = boxY;
  ctx.fillStyle = titleColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.font = `700 ${mainFontSize}px ${fontFamily}`;
  fillTextWithPseudoBold(
    ctx,
    "二手住宅价格指数：热点城市",
    centerX,
    cursorY,
    mainFontSize,
    true,
    titleBoldFactor,
  );
  cursorY += Math.round(mainFontSize * 1.24);

  ctx.font = `400 ${subFontSize}px ${fontFamily}`;
  const digitDropY = Math.max(0.5, subFontSize * 0.05);
  const rangeSeparator = "－";
  const rangeSeparatorWidth = ctx.measureText(rangeSeparator).width;
  const rangeStartWidth = measureOverlayTextSegments(ctx, rangeStartSegments);
  const rangeEndWidth = measureOverlayTextSegments(ctx, rangeEndSegments);
  const rangeTotalWidth = rangeStartWidth + rangeSeparatorWidth + rangeEndWidth;
  let rangeCursorX = centerX - rangeTotalWidth / 2;
  ctx.textAlign = "left";
  rangeCursorX += drawOverlayTextSegments(
    ctx,
    rangeCursorX,
    cursorY,
    rangeStartSegments,
    digitDropY,
  );
  ctx.fillText(rangeSeparator, rangeCursorX, cursorY);
  rangeCursorX += rangeSeparatorWidth;
  drawOverlayTextSegments(ctx, rangeCursorX, cursorY, rangeEndSegments, digitDropY);
  ctx.textAlign = "center";
  cursorY += Math.round(subFontSize * 1.24);
  ctx.textAlign = "left";
  const basePrefix = "定基";
  const prefixWidth = ctx.measureText(basePrefix).width;
  const valueWidth = measureOverlayTextSegments(ctx, baseValueSegments);
  const baseGap = Math.max(1, subFontSize * 0.08);
  const baseStartX = centerX - (prefixWidth + baseGap + valueWidth) / 2;
  const prefixNudgeY = -(subFontSize * 0.04);
  ctx.fillText(basePrefix, baseStartX, cursorY + prefixNudgeY);
  drawOverlayTextSegments(ctx, baseStartX + prefixWidth + baseGap, cursorY, baseValueSegments, digitDropY);
  ctx.textAlign = "center";
  cursorY += Math.round(subFontSize * 1.2);

  const header = [headerLabel, "最高位置", "当前位置", "累计跌幅", "跌回"];
  const colRatios = getOverlayColumnRatios(isCrossSource);
  const colWidths = colRatios.map((ratio) => ratio * tableW);
  const rowHeight = Math.max(18, Math.round(Math.max(cellFontSize, cityFontSize) * 1.35));
  const headerHeight = Math.max(19, Math.round(headerFontSize * 1.42));
  const topY = cursorY;

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = Math.max(1, Math.round(scaleY));
  ctx.beginPath();
  ctx.moveTo(tableX, topY);
  ctx.lineTo(tableX + tableW, topY);
  ctx.stroke();

  const headerBottomY = topY + headerHeight;
  ctx.beginPath();
  ctx.moveTo(tableX, headerBottomY);
  ctx.lineTo(tableX + tableW, headerBottomY);
  ctx.stroke();

  ctx.font = `700 ${headerFontSize}px ${fontFamily}`;
  ctx.fillStyle = chartTheme.overlayTextColor;
  ctx.textBaseline = "middle";
  let runningX = tableX;
  const headerTextY = topY + headerHeight / 2 - Math.max(0.5, headerFontSize * 0.05);
  for (let i = 0; i < header.length; i += 1) {
    const midX = runningX + colWidths[i] / 2;
    fillTextWithPseudoBold(ctx, header[i], midX, headerTextY, headerFontSize, true, headerBoldFactor);
    runningX += colWidths[i];
  }
  ctx.textBaseline = "top";

  ctx.font = `400 ${cellFontSize}px ${fontFamily}`;
  orderedRows.forEach((row, index) => {
    const rowTop = headerBottomY + index * rowHeight;
    const rowBottom = rowTop + rowHeight;
    const recoverText = row.recoverMonth ? row.recoverMonth.replace("-", ".") : "-";
    const drawdownText = isFiniteNumber(row.drawdownFromPeakPct)
      ? `${Math.abs(row.drawdownFromPeakPct).toFixed(1)}%`
      : "-";
    const cityName = row.cityName || row.name || "-";
    const sourceLabel = isCrossSource ? String(row.sourceLabel || "") : "";
    const cells = [cityName, formatNumber(row.peakValue, 1), formatNumber(row.latestValue, 1), drawdownText, recoverText];

    let colStartX = tableX;
    for (let i = 0; i < cells.length; i += 1) {
      const midX = colStartX + colWidths[i] / 2;
      const currentFontSize = i === 0 ? cityFontSize : cellFontSize;
      const rowTextY = rowTop + Math.round((rowHeight - currentFontSize) / 2) - 1;
      if (i === 0 && sourceLabel) {
        const mainText = cityName;
        const subText = `（${sourceLabel}）`;
        const mainFont = `400 ${cityFontSize}px ${fontFamily}`;
        const subFontSize = Math.max(10, Math.round(cityFontSize * 0.82));
        const subFont = `400 ${subFontSize}px ${fontFamily}`;

        ctx.textAlign = "center";
        ctx.font = mainFont;
        const mainWidth = ctx.measureText(mainText).width;
        ctx.fillStyle = chartTheme.overlayTextColor;
        fillTextWithPseudoBold(ctx, mainText, midX, rowTextY, cityFontSize, true, cityBoldFactor);

        ctx.textAlign = "left";
        ctx.font = subFont;
        ctx.fillStyle = chartTheme.overlaySubTextColor;
        ctx.fillText(
          subText,
          midX + mainWidth / 2 + 2,
          rowTextY + Math.max(0, Math.round((cityFontSize - subFontSize) * 0.45)),
        );
        ctx.fillStyle = chartTheme.overlayTextColor;
        ctx.textAlign = "center";
        ctx.font = mainFont;
      } else {
        ctx.font = `400 ${currentFontSize}px ${fontFamily}`;
        fillTextWithPseudoBold(
          ctx,
          String(cells[i]),
          midX,
          rowTextY,
          currentFontSize,
          i === 0,
          i === 0 ? cityBoldFactor : 1,
        );
      }
      colStartX += colWidths[i];
    }

    if (index === orderedRows.length - 1) {
      ctx.beginPath();
      ctx.moveTo(tableX, rowBottom);
      ctx.lineTo(tableX + tableW, rowBottom);
      ctx.stroke();
    }
  });

  cursorY = headerBottomY + orderedRows.length * rowHeight + Math.round(8 * scaleY);
  ctx.font = `400 ${noteFontSize}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.fillStyle = titleColor;
  const noteLeftX = tableX - noteFontSize * 1.5;
  ctx.fillText(`*数据来源：${sourceNoteText}`, noteLeftX, cursorY);
  ctx.fillText(
    "*图表制作：公众号 - 一座独立屋",
    noteLeftX,
    cursorY + Math.round(noteFontSize * 1.35),
  );
}

async function exportCurrentChartImage(pixelRatio = 2, label = "标准清晰") {
  if (!latestRenderContext) {
    setStatus("暂无可导出的图表，请先生成。", true);
    return;
  }

  await waitForChartFonts();

  let stageSnapshot = null;
  try {
    stageSnapshot = await captureChartStageSnapshot(pixelRatio);
  } catch (error) {
    stageSnapshot = null;
  }

  if (stageSnapshot?.dataURL) {
    const suffix = pixelRatio >= 4 ? "-ultra-hd" : "";
    const filename = `house-price-base100-${latestRenderContext.startMonth}-to-${latestRenderContext.endMonth}${suffix}.png`;
    downloadByDataURL(stageSnapshot.dataURL, filename);
    setStatus(`图片已导出（${label}，与当前页面显示一致）。`, false);
    return;
  }

  const chartTheme = getActiveChartThemeStyle();
  const chartDataUrl = chart.getDataURL({
    type: "png",
    pixelRatio,
    backgroundColor: chartTheme.chartBackground,
    excludeComponents: ["toolbox", "dataZoom"],
  });
  let chartImage;
  try {
    chartImage = await loadImageByURL(chartDataUrl);
  } catch (error) {
    setStatus("导出失败，请重试。", true);
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = chartImage.width;
  canvas.height = chartImage.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    setStatus("导出失败：无法创建画布。", true);
    return;
  }
  ctx.fillStyle = chartTheme.chartBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(chartImage, 0, 0);
  drawOverlaySummaryOnCanvas(ctx, canvas.width, canvas.height, latestRenderContext);

  const suffix = pixelRatio >= 4 ? "-ultra-hd" : "";
  const filename = `house-price-base100-${latestRenderContext.startMonth}-to-${latestRenderContext.endMonth}${suffix}.png`;
  downloadByDataURL(canvas.toDataURL("image/png"), filename);
  setStatus(`图片已导出（${label}，含当前分析与表格设置）。`, false);
}

function getTextMeasureContext() {
  if (!textMeasureContext) {
    const measureCanvas = document.createElement("canvas");
    textMeasureContext = measureCanvas.getContext("2d");
  }
  return textMeasureContext;
}

function estimateLabelBox(lines, fontSize, padding, fontWeight = 700) {
  const safeLines = Array.isArray(lines) && lines.length > 0 ? lines : [""];
  const safePadding = Array.isArray(padding) && padding.length === 2 ? padding : [2, 4];
  const measureCtx = getTextMeasureContext();
  let maxLineWidth = 0;
  if (measureCtx) {
    measureCtx.font = `${fontWeight} ${fontSize}px ${CHART_FONT_FAMILY}`;
    safeLines.forEach((line) => {
      maxLineWidth = Math.max(maxLineWidth, measureCtx.measureText(String(line)).width);
    });
  } else {
    const fallbackWidth = Math.max(...safeLines.map((line) => String(line).length), 1);
    maxLineWidth = fallbackWidth * fontSize;
  }
  const lineHeight = Math.max(fontSize + 2, Math.round(fontSize * 1.2));
  return {
    width: Math.ceil(maxLineWidth + safePadding[1] * 2),
    height: Math.ceil(lineHeight * safeLines.length + safePadding[0] * 2),
  };
}

function buildLabelRect({
  anchorX,
  anchorY,
  width,
  height,
  position = "top",
  distance = 0,
  offsetX = 0,
  offsetY = 0,
}) {
  let x = anchorX - width / 2 + offsetX;
  let y = anchorY + offsetY;

  if (position === "top") {
    y = y - distance - height;
  } else if (position === "bottom") {
    y = y + distance;
  } else {
    y = y - height / 2;
  }

  return {
    x,
    y,
    width,
    height,
  };
}

function calcRectOverflow(rect, bounds) {
  const overflowLeft = Math.max(0, bounds.left - rect.x);
  const overflowRight = Math.max(0, rect.x + rect.width - bounds.right);
  const overflowTop = Math.max(0, bounds.top - rect.y);
  const overflowBottom = Math.max(0, rect.y + rect.height - bounds.bottom);
  return overflowLeft + overflowRight + overflowTop + overflowBottom;
}

function rectsOverlap(a, b, padding = 2) {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

function resolvePeakLabelLayouts(
  rendered,
  months,
  yMin,
  yMax,
  labelGapMonths,
  responsiveChartWidth = chart.getWidth(),
) {
  const layoutMap = new Map();
  if (!Array.isArray(rendered) || rendered.length === 0 || !Array.isArray(months) || months.length === 0) {
    return layoutMap;
  }

  const chartWidth = chart.getWidth();
  const chartHeight = chart.getHeight();
  const gridLayout = resolveChartGridLayout(chartWidth);
  const plotBounds = {
    left: gridLayout.left,
    right: Math.max(gridLayout.left + 1, chartWidth - gridLayout.right),
    top: gridLayout.top,
    bottom: Math.max(gridLayout.top + 1, chartHeight - gridLayout.bottom),
  };
  const peakLabelBounds = {
    left: 8,
    right: Math.max(9, chartWidth - 8),
    top: 8,
    bottom: Math.max(9, chartHeight - 8),
  };
  const plotWidth = Math.max(1, plotBounds.right - plotBounds.left);
  const plotHeight = Math.max(1, plotBounds.bottom - plotBounds.top);
  const ySpan = Math.max(1e-6, yMax - yMin);
  const monthIndexMap = new Map(months.map((month, index) => [month, index]));

  function toPixelCoord(month, value) {
    const monthIndex = monthIndexMap.get(month);
    if (!Number.isInteger(monthIndex) || !isFiniteNumber(value)) return null;
    const xRatio = months.length > 1 ? monthIndex / (months.length - 1) : 0;
    const yRatio = clampNumber((value - yMin) / ySpan, 0, 1);
    return {
      x: plotBounds.left + xRatio * plotWidth,
      y: plotBounds.bottom - yRatio * plotHeight,
    };
  }

  const occupiedRects = [];

  const compactMobile = responsiveChartWidth <= RESPONSIVE_BREAKPOINTS.compact;
  const mediumMobile =
    responsiveChartWidth > RESPONSIVE_BREAKPOINTS.compact &&
    responsiveChartWidth <= RESPONSIVE_BREAKPOINTS.medium;
  const topCandidateStyles = compactMobile
    ? [
        { position: "top", distance: 5, fontSize: 9.2, padding: [1, 4] },
        { position: "top", distance: 4, fontSize: 9.2, padding: [1, 4] },
        { position: "top", distance: 6, fontSize: 8.7, padding: [1, 3] },
        { position: "top", distance: 3, fontSize: 8.7, padding: [1, 3] },
        { position: "top", distance: 7, fontSize: 8.2, padding: [1, 3] },
      ]
    : mediumMobile
      ? [
          { position: "top", distance: 6, fontSize: 10.6, padding: [1, 5] },
          { position: "top", distance: 5, fontSize: 10.6, padding: [1, 5] },
          { position: "top", distance: 8, fontSize: 9.9, padding: [1, 4] },
          { position: "top", distance: 4, fontSize: 9.9, padding: [1, 4] },
          { position: "top", distance: 9, fontSize: 9.3, padding: [1, 4] },
        ]
      : [
          { position: "top", distance: 7, fontSize: 12, padding: [2, 6] },
          { position: "top", distance: 5, fontSize: 12, padding: [2, 6] },
          { position: "top", distance: 9, fontSize: 11, padding: [2, 5] },
          { position: "top", distance: 4, fontSize: 11, padding: [2, 5] },
          { position: "top", distance: 11, fontSize: 10, padding: [1, 4] },
        ];
  const fallbackCandidateStyles = compactMobile
    ? [
        { position: "bottom", distance: 5, fontSize: 8.7, padding: [1, 3] },
        { position: "bottom", distance: 6, fontSize: 8.2, padding: [1, 3] },
      ]
    : mediumMobile
      ? [
          { position: "bottom", distance: 6, fontSize: 9.9, padding: [1, 4] },
          { position: "bottom", distance: 7, fontSize: 9.3, padding: [1, 4] },
        ]
      : [
          { position: "bottom", distance: 6, fontSize: 11, padding: [2, 5] },
          { position: "bottom", distance: 8, fontSize: 10, padding: [1, 4] },
        ];
  const candidateOffsetX = compactMobile
    ? [0, -6, 6, -10, 10, -14, 14, -18, 18]
    : [0, -8, 8, -14, 14, -20, 20, -26, 26];
  const candidateOffsetY = compactMobile ? [0, 2, -2, 4] : [0, 3, -3, 6];
  const peakAnnotations = rendered
    .filter((item) => item.peakMarker && isFiniteNumber(item.peakMarker.value))
    .map((item) => {
      const coord = toPixelCoord(item.peakMarker.month, item.peakMarker.value);
      if (!coord) return null;
      return {
        cityName: item.name,
        monthText: item.peakMarker.month.replace("-", "."),
        anchorX: coord.x,
        anchorY: coord.y,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.anchorX - b.anchorX || b.anchorY - a.anchorY);

  peakAnnotations.forEach((annotation) => {
    const lines = ["最高点", annotation.monthText];
    let bestCandidate = null;

    const evaluateCandidates = (styles, styleRankOffset = 0) => {
      let best = null;
      let bestClear = null;
      let bestNoOverlap = null;

      for (let styleIndex = 0; styleIndex < styles.length; styleIndex += 1) {
        const style = styles[styleIndex];
        const labelBox = estimateLabelBox(lines, style.fontSize, style.padding, 700);

        for (const offsetX of candidateOffsetX) {
          for (const offsetY of candidateOffsetY) {
            const rect = buildLabelRect({
              anchorX: annotation.anchorX,
              anchorY: annotation.anchorY,
              width: labelBox.width,
              height: labelBox.height,
              position: style.position,
              distance: style.distance,
              offsetX,
              offsetY,
            });

            let overlapCount = 0;
            for (const occupied of occupiedRects) {
              if (rectsOverlap(rect, occupied, 3)) overlapCount += 1;
            }

            const overflow = calcRectOverflow(rect, peakLabelBounds);
            const score =
              overlapCount * 100000 +
              overflow * 120 +
              (styleRankOffset + styleIndex) * 40 +
              Math.abs(offsetX) * 8 +
              Math.abs(offsetY);

            const candidate = {
              score,
              style,
              offsetX,
              offsetY,
              rect,
              overlapCount,
              overflow,
            };

            if (!best || candidate.score < best.score) {
              best = candidate;
            }

            if (candidate.overlapCount === 0 && candidate.overflow === 0) {
              if (!bestClear || candidate.score < bestClear.score) {
                bestClear = candidate;
              }
            }

            if (candidate.overlapCount === 0) {
              if (
                !bestNoOverlap ||
                candidate.overflow < bestNoOverlap.overflow ||
                (candidate.overflow === bestNoOverlap.overflow &&
                  candidate.score < bestNoOverlap.score)
              ) {
                bestNoOverlap = candidate;
              }
            }
          }
        }
      }

      return {
        best,
        bestClear,
        bestNoOverlap,
      };
    };

    const topEval = evaluateCandidates(topCandidateStyles, 0);
    if (topEval.bestClear) {
      bestCandidate = topEval.bestClear;
    } else if (topEval.bestNoOverlap && topEval.bestNoOverlap.overflow <= 16) {
      bestCandidate = topEval.bestNoOverlap;
    } else {
      bestCandidate = topEval.best;
      const topHasUsablePlacement =
        topEval.bestNoOverlap && topEval.bestNoOverlap.overflow <= 26;
      if (!topHasUsablePlacement) {
        const fallbackEval = evaluateCandidates(
          fallbackCandidateStyles,
          topCandidateStyles.length,
        );
        if (fallbackEval.bestClear) {
          bestCandidate = fallbackEval.bestClear;
        } else if (fallbackEval.best && (!bestCandidate || fallbackEval.best.score < bestCandidate.score)) {
          bestCandidate = fallbackEval.best;
        }
      }
    }

    if (!bestCandidate) return;
    occupiedRects.push(bestCandidate.rect);
    layoutMap.set(annotation.cityName, {
      position: bestCandidate.style.position,
      distance: bestCandidate.style.distance,
      fontSize: bestCandidate.style.fontSize,
      padding: bestCandidate.style.padding,
      offset: [bestCandidate.offsetX, bestCandidate.offsetY],
    });
  });

  return layoutMap;
}

function buildPeakLabelRectList(rendered, peakLabelLayouts, toPixelCoord) {
  const rects = [];
  rendered.forEach((item) => {
    if (!item.peakMarker || !isFiniteNumber(item.peakMarker.value)) return;
    const coord = toPixelCoord(item.peakMarker.month, item.peakMarker.value);
    if (!coord) return;
    const layout = peakLabelLayouts.get(item.name);
    const labelText = [
      "最高点",
      String(item.peakMarker.month || "").replace("-", "."),
    ];
    const fontSize = layout?.fontSize ?? 12;
    const padding = layout?.padding || [2, 6];
    const labelBox = estimateLabelBox(labelText, fontSize, padding, 700);
    const rect = buildLabelRect({
      anchorX: coord.x,
      anchorY: coord.y,
      width: labelBox.width,
      height: labelBox.height,
      position: layout?.position || "top",
      distance: layout?.distance ?? 8,
      offsetX: Array.isArray(layout?.offset) ? (layout.offset[0] || 0) : 0,
      offsetY: Array.isArray(layout?.offset) ? (layout.offset[1] || 0) : 0,
    });
    rects.push(rect);
  });
  return rects;
}

function resolveDrawdownValueLabelOffset(
  anchorX,
  anchorY,
  peakLabelRects,
  chartBounds,
  labelFontSize = 14,
  labelPadding = [2, 4],
) {
  if (!Number.isFinite(anchorX) || !Number.isFinite(anchorY) || !Array.isArray(peakLabelRects)) {
    return [0, 0];
  }

  const labelLines = ["累计跌幅", "00.0%"];
  const labelBox = estimateLabelBox(labelLines, labelFontSize, labelPadding, 700);
  const step = labelFontSize <= 10 ? 3 : 4;
  const maxOffsetPx = Math.max(16, Math.round(labelFontSize * 1.9));
  const offsetCandidates = [0, -step, step, -(step * 2), step * 2, -(step * 3), step * 3, -(step * 4), step * 4, -(step * 5), step * 5, -(step * 6), step * 6].filter(
    (offsetY) => Math.abs(offsetY) <= maxOffsetPx,
  );

  let best = null;
  for (const offsetY of offsetCandidates) {
    const rect = buildLabelRect({
      anchorX,
      anchorY,
      width: labelBox.width,
      height: labelBox.height,
      position: "inside",
      offsetY,
    });

    const overlapCount = peakLabelRects.reduce(
      (count, peakRect) => (rectsOverlap(rect, peakRect, 5) ? count + 1 : count),
      0,
    );
    const overflow = calcRectOverflow(rect, chartBounds);
    const score = overlapCount * 1000000 + overflow * 220 + Math.abs(offsetY) * 4;
    if (!best || score < best.score) {
      best = { score, offsetY, overlapCount, overflow };
    }
    if (overlapCount === 0 && overflow === 0) break;
  }

  return best ? [0, best.offsetY] : [0, 0];
}

function resolveDrawdownVerticalLayout(drawdown, yRange, plotHeight, labelBoxHeightPx, offsetY = 0) {
  const safePlotHeight = Math.max(1, plotHeight);
  const safeRange = Math.max(1e-6, yRange);
  const valuePerPixel = safeRange / safePlotHeight;
  const drawdownSpan = Math.max(0, drawdown.peakValue - drawdown.latestValue);
  const verticalMid = (drawdown.peakValue + drawdown.latestValue) / 2;

  const desiredHalfGapPx = Math.max(7, Math.round(labelBoxHeightPx / 2 + 1));
  let halfGapValue = desiredHalfGapPx * valuePerPixel;
  const maxHalfGapValue = Math.max(0.05, drawdownSpan / 2 - 0.2);
  halfGapValue = Math.min(halfGapValue, maxHalfGapValue);

  let labelCenterValue = verticalMid - offsetY * valuePerPixel;
  const minCenter = drawdown.latestValue + halfGapValue + 0.2;
  const maxCenter = drawdown.peakValue - halfGapValue - 0.2;
  if (minCenter <= maxCenter) {
    labelCenterValue = clampNumber(labelCenterValue, minCenter, maxCenter);
  } else {
    labelCenterValue = verticalMid;
  }

  return {
    labelCenterValue,
    halfGapValue,
  };
}

function makeOption(
  rendered,
  months,
  startMonth,
  endMonth,
  hiddenCityNames,
  zoomStartMonth,
  zoomEndMonth,
) {
  const axisMonths = months.map((month) => normalizeMonthToken(month));
  const monthToAxisMap = new Map();
  axisMonths.forEach((axisMonth, index) => {
    const rawMonth = String(months[index] || "").trim();
    if (rawMonth && axisMonth) {
      monthToAxisMap.set(rawMonth, axisMonth);
    }
    if (axisMonth) {
      monthToAxisMap.set(axisMonth, axisMonth);
    }
  });
  const toAxisMonth = (month) => {
    const rawText = String(month || "").trim();
    if (!rawText) return "";
    if (monthToAxisMap.has(rawText)) {
      return monthToAxisMap.get(rawText);
    }
    const normalized = normalizeMonthToken(rawText);
    if (monthToAxisMap.has(normalized)) {
      return monthToAxisMap.get(normalized);
    }
    return normalized || rawText;
  };

  const zoomStartToken = typeof zoomStartMonth === "string" ? normalizeMonthToken(zoomStartMonth) : undefined;
  const zoomEndToken = typeof zoomEndMonth === "string" ? normalizeMonthToken(zoomEndMonth) : undefined;
  let visibleStartIndex = 0;
  let visibleEndIndex = Math.max(0, months.length - 1);
  if (typeof zoomStartToken === "string") {
    const idx = axisMonths.indexOf(zoomStartToken);
    if (idx >= 0) visibleStartIndex = idx;
  }
  if (typeof zoomEndToken === "string") {
    const idx = axisMonths.indexOf(zoomEndToken);
    if (idx >= 0) visibleEndIndex = idx;
  }
  if (visibleStartIndex > visibleEndIndex) {
    const temp = visibleStartIndex;
    visibleStartIndex = visibleEndIndex;
    visibleEndIndex = temp;
  }
  const selectedMap = Object.fromEntries(
    rendered.map((item) => [item.name, !hiddenCityNames.has(item.name)]),
  );
  const chartWidth = chart.getWidth();
  const chartHeight = chart.getHeight();
  const responsiveChartWidth = getResponsiveChartWidth(chartWidth);
  const gridLayout = resolveChartGridLayout(chartWidth);
  const allFiniteValues = rendered.flatMap((item) => item.normalized.filter(isFiniteNumber));
  const yMin = allFiniteValues.length > 0 ? Math.min(...allFiniteValues) : 80;
  const yMax = allFiniteValues.length > 0 ? Math.max(...allFiniteValues) : 120;
  const yRange = Math.max(1, yMax - yMin);
  const usableChartWidth = Math.max(
    220,
    chartWidth -
      gridLayout.left -
      gridLayout.right -
      (responsiveChartWidth <= RESPONSIVE_BREAKPOINTS.medium ? 12 : 24),
  );
  const labelGapMonths = Math.max(
    4,
    Math.round((92 * Math.max(1, months.length - 1)) / usableChartWidth),
  );
  const peakLabelLayouts = resolvePeakLabelLayouts(
    rendered,
    months,
    yMin,
    yMax,
    labelGapMonths,
    responsiveChartWidth,
  );
  const xAxisLabelLayout = resolveXAxisLabelLayout(
    axisMonths,
    chartWidth,
    visibleStartIndex,
    visibleEndIndex,
  );
  const compactMobile = responsiveChartWidth <= RESPONSIVE_BREAKPOINTS.compact;
  const mediumMobile =
    responsiveChartWidth > RESPONSIVE_BREAKPOINTS.compact &&
    responsiveChartWidth <= RESPONSIVE_BREAKPOINTS.medium;
  const endLabelFontSize = compactMobile ? 11 : mediumMobile ? 14 : 18;
  const legendBaseFontSize = compactMobile ? 10.8 : mediumMobile ? 12.2 : 15;
  const legendFontSize = Number((legendBaseFontSize * 1.05).toFixed(2));
  const END_LABEL_BOLD_FACTOR = 1.07;
  const LEGEND_BOLD_FACTOR = 1.08;
  const endLabelMainWeight = Math.round(700 * END_LABEL_BOLD_FACTOR);
  const endLabelSubWeight = Math.round(600 * END_LABEL_BOLD_FACTOR);
  const legendFontWeight = Math.round(700 * LEGEND_BOLD_FACTOR);
  const endLabelStrokeWidth = Number(Math.max(0.06, endLabelFontSize * 0.008).toFixed(2));
  const legendStrokeWidth = Number(Math.max(0.06, legendFontSize * 0.008).toFixed(2));
  const xAxisLabelScale = compactMobile ? 0.98 : 1.1;
  const xAxisLabelFontSize = Number((xAxisLabelLayout.fontSize * xAxisLabelScale).toFixed(2));
  const yAxisLabelFontSize = compactMobile ? 11 : mediumMobile ? 12 : 14;
  const seriesLineWidth = compactMobile ? 1.7 : mediumMobile ? 2.1 : 3.02;
  const markLineWidth = compactMobile ? 1.04 : mediumMobile ? 1.32 : 2;
  const markSymbolSize = compactMobile ? 7 : mediumMobile ? 9 : 10;
  const drawdownLabelFontSize = compactMobile ? 10 : mediumMobile ? 12 : 14;
  const drawdownLabelPadding = compactMobile ? [1, 3] : mediumMobile ? [1, 4] : [2, 4];
  const recoverLabelFontSize = compactMobile ? 9.5 : mediumMobile ? 11 : 14;
  const recoverLabelPadding = compactMobile ? [1, 2] : mediumMobile ? [1, 2] : [1, 2];
  const baseTextFontSize = compactMobile ? 12 : mediumMobile ? 13 : 14;
  const legendBottom = Math.max(
    15,
    Math.round(
      gridLayout.bottom -
        (responsiveChartWidth <= RESPONSIVE_BREAKPOINTS.compact
          ? 50
          : responsiveChartWidth <= RESPONSIVE_BREAKPOINTS.medium
            ? 58
            : 66),
    ),
  );
  const plotBounds = {
    left: gridLayout.left,
    right: Math.max(gridLayout.left + 1, chartWidth - gridLayout.right),
    top: gridLayout.top,
    bottom: Math.max(gridLayout.top + 1, chartHeight - gridLayout.bottom),
  };
  const plotWidth = Math.max(1, plotBounds.right - plotBounds.left);
  const plotHeight = Math.max(1, plotBounds.bottom - plotBounds.top);
  const ySpan = Math.max(1e-6, yMax - yMin);
  const monthIndexMap = new Map();
  axisMonths.forEach((axisMonth, index) => {
    if (axisMonth) {
      monthIndexMap.set(axisMonth, index);
    }
    const rawMonth = String(months[index] || "").trim();
    if (rawMonth) {
      monthIndexMap.set(rawMonth, index);
    }
  });
  const toPixelCoord = (month, value) => {
    const normalizedMonth = normalizeMonthToken(month);
    const monthIndex = monthIndexMap.has(normalizedMonth)
      ? monthIndexMap.get(normalizedMonth)
      : monthIndexMap.get(String(month || "").trim());
    if (!Number.isInteger(monthIndex) || !isFiniteNumber(value)) return null;
    const xRatio = months.length > 1 ? monthIndex / (months.length - 1) : 0;
    const yRatio = clampNumber((value - yMin) / ySpan, 0, 1);
    return {
      x: plotBounds.left + xRatio * plotWidth,
      y: plotBounds.bottom - yRatio * plotHeight,
    };
  };
  const labelBounds = {
    left: 8,
    right: Math.max(9, chartWidth - 8),
    top: 8,
    bottom: Math.max(9, chartHeight - 8),
  };
  const chartTheme = getActiveChartThemeStyle();
  const chartTextMaskColor = chartTheme.textMaskColor;
  const peakLabelRects = buildPeakLabelRectList(rendered, peakLabelLayouts, toPixelCoord);
  const occupiedDrawdownLabelRects = [];
  const occupiedRecoverLabelRects = [];

  return {
    backgroundColor: chartTheme.chartBackground,
    color: rendered.map((item) => item.color),
    animationDuration: 650,
    textStyle: {
      fontFamily: CHART_FONT_FAMILY,
      fontSize: baseTextFontSize,
      color: chartTheme.chartTextColor,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "line",
        snap: true,
        lineStyle: {
          color: chartTheme.tooltipAxisPointerColor,
          width: 1.15,
          type: "dashed",
        },
      },
      backgroundColor: chartTheme.tooltipBackground,
      borderColor: chartTheme.tooltipBorderColor,
      borderWidth: 1,
      padding: [9, 12],
      extraCssText: chartTheme.tooltipExtraCssText,
      textStyle: {
        fontFamily: CHART_FONT_FAMILY,
        color: chartTheme.tooltipTextColor,
      },
      formatter(params) {
        const rows = Array.isArray(params) ? params : [params];
        if (!rows.length) return "";
        const axisRaw = rows[0]?.axisValue ?? rows[0]?.axisValueLabel ?? "";
        const headText = formatMonthDot(axisRaw);
        const detail = rows
          .map((item) => {
            const value = Array.isArray(item?.value)
              ? item.value[item.value.length - 1]
              : item?.value;
            const valueText = isFiniteNumber(value) ? value.toFixed(1) : "-";
            return `${item?.marker || ""} ${item?.seriesName || "-"}&nbsp;&nbsp;${valueText}`;
          })
          .join("<br/>");
        return `${headText}<br/>${detail}`;
      },
      valueFormatter(value) {
        return isFiniteNumber(value) ? value.toFixed(1) : "-";
      },
    },
    legend: {
      bottom: legendBottom,
      textStyle: {
        color: chartTheme.legendTextColor,
        fontSize: legendFontSize,
        fontWeight: legendFontWeight,
        textBorderColor: chartTheme.legendTextColor,
        textBorderWidth: legendStrokeWidth,
        fontFamily: CHART_FONT_FAMILY,
      },
      itemWidth: 20,
      itemHeight: 4,
      selected: selectedMap,
    },
    toolbox: {
      right: 8,
      top: 6,
      feature: {
        myExportImage: {
          show: true,
          title: "导出图片（标准）",
          icon: "path://M128 704h768v64H128zM480 128h64v352h112L512 640 368 480h112z",
          onclick: () => exportCurrentChartImage(2, "标准清晰"),
        },
        myExportImageUltra: {
          show: true,
          title: "导出图片（超清）",
          icon: "path://M128 704h768v64H128zM480 128h64v352h112L512 640 368 480h112z",
          onclick: () => exportCurrentChartImage(4, "超清"),
        },
      },
    },
    grid: {
      left: gridLayout.left,
      right: gridLayout.right,
      top: gridLayout.top,
      bottom: gridLayout.bottom,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: axisMonths,
      min: visibleStartIndex,
      max: visibleEndIndex,
      axisTick: {
        show: responsiveChartWidth > RESPONSIVE_BREAKPOINTS.medium,
        alignWithLabel: true,
        interval: 0,
        length: responsiveChartWidth <= RESPONSIVE_BREAKPOINTS.compact ? 4 : 5,
        lineStyle: { color: chartTheme.xAxisLineColor },
      },
      axisLine: { lineStyle: { color: chartTheme.xAxisLineColor, width: 1 } },
      axisLabel: {
        color: chartTheme.xAxisLabelColor,
        interval: 0,
        margin: xAxisLabelLayout.margin,
        rotate: xAxisLabelLayout.rotate,
        fontSize: xAxisLabelFontSize,
        fontWeight: 700,
        hideOverlap: true,
        showMinLabel: true,
        showMaxLabel: true,
        fontFamily: CHART_FONT_FAMILY,
        formatter(value, index) {
          const normalizedValue = normalizeMonthToken(value);
          if (!xAxisLabelLayout.isLabelVisible(normalizedValue || value, index)) return "";
          return xAxisLabelLayout.formatLabel(normalizedValue || value);
        },
      },
    },
    yAxis: {
      type: "value",
      min: function (value) {
        return Math.floor((value.min - 5) / 10) * 10;
      },
      max: function (value) {
        return Math.ceil((value.max + 5) / 10) * 10;
      },
      axisLine: { show: true, lineStyle: { color: chartTheme.yAxisLineColor, width: 1 } },
      axisTick: { show: true, inside: true, lineStyle: { color: chartTheme.yAxisLineColor } },
      splitLine: { show: false },
      axisLabel: {
        color: chartTheme.yAxisLabelColor,
        fontSize: yAxisLabelFontSize,
        fontWeight: 600,
        fontFamily: CHART_FONT_FAMILY,
        formatter(value) {
          return Number(value).toFixed(0);
        },
      },
    },
    series: rendered.map((item) => {
      const drawdown = item.drawdown;
      const peakMarker = item.peakMarker;
      const peakLabelLayout = peakLabelLayouts.get(item.name);
      const markLineData = [];
      const markPointData = [];

      if (peakMarker) {
        markPointData.push({
          coord: [toAxisMonth(peakMarker.month), peakMarker.value],
          symbol: "circle",
          symbolSize: 2,
          itemStyle: {
            color: "rgba(0,0,0,0)",
            borderColor: "rgba(0,0,0,0)",
            borderWidth: 0,
          },
          label: {
            show: true,
            position: peakLabelLayout?.position || "top",
            distance: peakLabelLayout?.distance ?? 8,
            align: "center",
            color: item.color,
            fontFamily: CHART_FONT_FAMILY,
            fontSize: peakLabelLayout?.fontSize ?? 12,
            fontWeight: 700,
            backgroundColor: chartTextMaskColor,
            padding: peakLabelLayout?.padding || [2, 6],
            offset: peakLabelLayout?.offset || [0, 0],
            formatter: `最高点\n${peakMarker.month.replace("-", ".")}`,
          },
        });
      }

      if (drawdown) {
        const drawdownLabelLines = ["累计跌幅", "00.0%"];
        const drawdownLabelBox = estimateLabelBox(
          drawdownLabelLines,
          drawdownLabelFontSize,
          drawdownLabelPadding,
          700,
        );
        const verticalMid = (drawdown.peakValue + drawdown.latestValue) / 2;
        const drawdownLabelAnchor = toPixelCoord(drawdown.peakMonth, verticalMid);
        const drawdownLabelOffset = drawdownLabelAnchor
          ? resolveDrawdownValueLabelOffset(
              drawdownLabelAnchor.x,
              drawdownLabelAnchor.y,
              peakLabelRects,
              labelBounds,
              drawdownLabelFontSize,
              drawdownLabelPadding,
            )
          : [0, 0];
        const drawdownVerticalLayout = resolveDrawdownVerticalLayout(
          drawdown,
          yRange,
          plotHeight,
          drawdownLabelBox.height,
          drawdownLabelOffset[1] || 0,
        );
        let labelCenterValue = drawdownVerticalLayout.labelCenterValue;
        const valuePerPixel = yRange / Math.max(1, plotHeight);
        const occupiedLabelRects = occupiedDrawdownLabelRects.concat(occupiedRecoverLabelRects);
        const centerMin = drawdown.latestValue + drawdownVerticalLayout.halfGapValue + 0.2;
        const centerMax = drawdown.peakValue - drawdownVerticalLayout.halfGapValue - 0.2;
        let drawdownLabelOffsetX = 0;
        if (centerMin <= centerMax) {
          const centerShiftPxCandidates = [0, -4, 4, -8, 8, -12, 12, -16, 16, -20, 20, -24, 24, -28, 28];
          const centerShiftXCandidates = [0, -8, 8, -14, 14];
          let bestCenter = null;
          for (const shiftPx of centerShiftPxCandidates) {
            for (const shiftX of centerShiftXCandidates) {
              const candidateCenter = clampNumber(
                labelCenterValue - shiftPx * valuePerPixel,
                centerMin,
                centerMax,
              );
              const candidateCoord = toPixelCoord(drawdown.peakMonth, candidateCenter);
              if (!candidateCoord) continue;
              const candidateRect = buildLabelRect({
                anchorX: candidateCoord.x,
                anchorY: candidateCoord.y,
                width: drawdownLabelBox.width + 10,
                height: drawdownLabelBox.height + 6,
                position: "inside",
                offsetX: shiftX,
              });

              let peakOverlapCount = 0;
              let peakNearCount = 0;
              for (const peakRect of peakLabelRects) {
                if (!peakRect) continue;
                if (rectsOverlap(candidateRect, peakRect, 8)) {
                  peakOverlapCount += 1;
                  continue;
                }
                const candidateCenterX = candidateRect.x + candidateRect.width / 2;
                const peakCenterX = peakRect.x + peakRect.width / 2;
                const dx = Math.abs(candidateCenterX - peakCenterX);
                const candidateBottom = candidateRect.y + candidateRect.height;
                const peakBottom = peakRect.y + peakRect.height;
                const verticalGap = Math.max(peakRect.y - candidateBottom, candidateRect.y - peakBottom, 0);
                const nearX = dx <= Math.max(candidateRect.width, peakRect.width) * 0.42;
                const nearY = verticalGap <= 12;
                if (nearX && nearY) {
                  peakNearCount += 1;
                }
              }

              let labelOverlapCount = 0;
              let labelNearCount = 0;
              for (const occupiedRect of occupiedLabelRects) {
                if (!occupiedRect) continue;
                if (rectsOverlap(candidateRect, occupiedRect, 6)) {
                  labelOverlapCount += 1;
                  continue;
                }
                const candidateCenterX = candidateRect.x + candidateRect.width / 2;
                const occupiedCenterX = occupiedRect.x + occupiedRect.width / 2;
                const dx = Math.abs(candidateCenterX - occupiedCenterX);
                const candidateBottom = candidateRect.y + candidateRect.height;
                const occupiedBottom = occupiedRect.y + occupiedRect.height;
                const verticalGap = Math.max(
                  occupiedRect.y - candidateBottom,
                  candidateRect.y - occupiedBottom,
                  0,
                );
                const nearX = dx <= Math.max(candidateRect.width, occupiedRect.width) * 0.46;
                const nearY = verticalGap <= 10;
                if (nearX && nearY) {
                  labelNearCount += 1;
                }
              }

              const overflow = calcRectOverflow(candidateRect, labelBounds);
              const score =
                peakOverlapCount * 2000000 +
                peakNearCount * 450000 +
                labelOverlapCount * 1500000 +
                labelNearCount * 550000 +
                overflow * 220 +
                Math.abs(shiftPx) * 4 +
                Math.abs(shiftX) * 12;
              if (!bestCenter || score < bestCenter.score) {
                bestCenter = {
                  score,
                  candidateCenter,
                  shiftX,
                  peakOverlapCount,
                  peakNearCount,
                  labelOverlapCount,
                  labelNearCount,
                  overflow,
                };
              }
              if (
                peakOverlapCount === 0 &&
                peakNearCount === 0 &&
                labelOverlapCount === 0 &&
                labelNearCount === 0 &&
                overflow === 0
              ) {
                break;
              }
            }
          }
          if (bestCenter) {
            labelCenterValue = bestCenter.candidateCenter;
            drawdownLabelOffsetX = bestCenter.shiftX || 0;
          }
        }
        const evaluateDrawdownRectConflict = (rect) => {
          if (!rect) return { overlapCount: 0, nearCount: 0, overflow: 0 };

          let overlapCount = 0;
          let nearCount = 0;
          const allAvoidRects = peakLabelRects.concat(occupiedLabelRects);
          for (const avoidRect of allAvoidRects) {
            if (!avoidRect) continue;
            if (rectsOverlap(rect, avoidRect, 8)) {
              overlapCount += 1;
              continue;
            }

            const rectCenterX = rect.x + rect.width / 2;
            const avoidCenterX = avoidRect.x + avoidRect.width / 2;
            const dx = Math.abs(rectCenterX - avoidCenterX);
            const rectBottom = rect.y + rect.height;
            const avoidBottom = avoidRect.y + avoidRect.height;
            const verticalGap = Math.max(avoidRect.y - rectBottom, rect.y - avoidBottom, 0);
            const nearX = dx <= Math.max(rect.width, avoidRect.width) * 0.52;
            const nearY = verticalGap <= 14;
            if (nearX && nearY) {
              nearCount += 1;
            }
          }

          return {
            overlapCount,
            nearCount,
            overflow: calcRectOverflow(rect, labelBounds),
          };
        };

        const toDrawdownRect = (centerValue, offsetX) => {
          const coord = toPixelCoord(drawdown.peakMonth, centerValue);
          if (!coord) return null;
          return buildLabelRect({
            anchorX: coord.x,
            anchorY: coord.y,
            width: drawdownLabelBox.width + 10,
            height: drawdownLabelBox.height + 6,
            position: "inside",
            offsetX,
          });
        };

        const initialRect = toDrawdownRect(labelCenterValue, drawdownLabelOffsetX);
        const initialConflict = evaluateDrawdownRectConflict(initialRect);
        if (centerMin <= centerMax && (initialConflict.overlapCount > 0 || initialConflict.nearCount > 0)) {
          const aggressiveShiftYCandidates = [0, -10, 10, -16, 16, -22, 22, -28, 28, -34, 34, -40, 40];
          const aggressiveShiftXCandidates = [0, -10, 10, -18, 18, -26, 26];
          let bestAggressive = null;
          for (const shiftY of aggressiveShiftYCandidates) {
            for (const shiftX of aggressiveShiftXCandidates) {
              const candidateCenter = clampNumber(
                labelCenterValue - shiftY * valuePerPixel,
                centerMin,
                centerMax,
              );
              const candidateOffsetX = drawdownLabelOffsetX + shiftX;
              const candidateRect = toDrawdownRect(candidateCenter, candidateOffsetX);
              const conflict = evaluateDrawdownRectConflict(candidateRect);
              const score =
                conflict.overlapCount * 3000000 +
                conflict.nearCount * 700000 +
                conflict.overflow * 260 +
                Math.abs(shiftY) * 3 +
                Math.abs(candidateOffsetX) * 10;
              if (!bestAggressive || score < bestAggressive.score) {
                bestAggressive = {
                  score,
                  candidateCenter,
                  candidateOffsetX,
                  conflict,
                };
              }
              if (
                conflict.overlapCount === 0 &&
                conflict.nearCount === 0 &&
                conflict.overflow === 0
              ) {
                break;
              }
            }
          }
          if (bestAggressive) {
            labelCenterValue = bestAggressive.candidateCenter;
            drawdownLabelOffsetX = bestAggressive.candidateOffsetX;
          }
        }

        const upperSegmentEnd = labelCenterValue + drawdownVerticalLayout.halfGapValue;
        const lowerSegmentStart = labelCenterValue - drawdownVerticalLayout.halfGapValue;

        markLineData.push([
          {
            coord: [toAxisMonth(drawdown.peakMonth), drawdown.peakValue],
            symbol: "none",
          },
          {
            coord: [toAxisMonth(drawdown.peakMonth), upperSegmentEnd],
            symbol: "none",
          },
        ]);

        markPointData.push({
          coord: [toAxisMonth(drawdown.peakMonth), labelCenterValue],
          symbol: "circle",
          symbolSize: 2,
          itemStyle: {
            color: "rgba(0,0,0,0)",
            borderColor: "rgba(0,0,0,0)",
            borderWidth: 0,
          },
          label: {
            show: true,
            position: "inside",
            distance: 0,
            align: "center",
            verticalAlign: "middle",
            color: item.color,
            fontFamily: CHART_FONT_FAMILY,
            fontSize: drawdownLabelFontSize,
            fontWeight: 700,
            backgroundColor: chartTextMaskColor,
            padding: drawdownLabelPadding,
            offset: [drawdownLabelOffsetX, 0],
            formatter: `累计跌幅\n${Math.abs(drawdown.drawdownPct).toFixed(1)}%`,
          },
        });
        const finalDrawdownCoord = toPixelCoord(drawdown.peakMonth, labelCenterValue);
        if (finalDrawdownCoord) {
          occupiedDrawdownLabelRects.push(
            buildLabelRect({
              anchorX: finalDrawdownCoord.x,
              anchorY: finalDrawdownCoord.y,
              width: drawdownLabelBox.width + 10,
              height: drawdownLabelBox.height + 6,
              position: "inside",
              offsetX: drawdownLabelOffsetX,
            }),
          );
        }

        const recoverLabelText = drawdown.recoverMonth
          ? `跌回 ${drawdown.recoverMonth.replace("-", ".")}`
          : "跌回 -";
        const recoverLabelBox = estimateLabelBox(
          [recoverLabelText],
          recoverLabelFontSize,
          recoverLabelPadding,
          700,
        );
        const rawHorizontalLayout = buildDrawdownHorizontalLayout(drawdown, {
          visibleStartIndex,
          visibleEndIndex,
          plotWidthPx: plotWidth,
          halfGapPx: Math.ceil(recoverLabelBox.width / 2 + 8),
        });
        const horizontalLayout = resolveRecoverLabelLayoutAvoidPeak(
          rawHorizontalLayout,
          drawdown,
          months,
          toPixelCoord,
          peakLabelRects,
          labelBounds,
          recoverLabelBox,
          occupiedDrawdownLabelRects.concat(occupiedRecoverLabelRects),
        );
        const hasHorizontalLayout = Boolean(horizontalLayout);
        const recoverDisplayMonth = hasHorizontalLayout
          ? months[horizontalLayout.startIndex] || drawdown.recoverDisplayMonth || drawdown.recoverMonth
          : null;
        const labelCenterIndex = hasHorizontalLayout ? horizontalLayout.labelCenterIndex : -1;
        const shouldShortVerticalArrow = hasHorizontalLayout
          ? (
              drawdown.peakIndex >= horizontalLayout.leftBreakIndex &&
              drawdown.peakIndex <= horizontalLayout.rightBreakIndex
            )
          : false;
        const arrowTipClearance = Math.max(1.2, drawdownVerticalLayout.halfGapValue * 0.36);
        let verticalArrowEnd = drawdown.latestValue;
        if (shouldShortVerticalArrow) {
          const shortenedEnd = Math.min(
            drawdown.latestValue + arrowTipClearance,
            lowerSegmentStart - 0.8,
          );
          if (shortenedEnd > drawdown.latestValue) {
            verticalArrowEnd = shortenedEnd;
          }
        }

        markLineData.push([
          {
            coord: [toAxisMonth(drawdown.peakMonth), lowerSegmentStart],
            symbol: "none",
          },
          {
            coord: [toAxisMonth(drawdown.peakMonth), verticalArrowEnd],
            symbol: "arrow",
          },
        ]);

        if (hasHorizontalLayout && recoverDisplayMonth) {
          markLineData.push([
            {
              coord: [toAxisMonth(months[horizontalLayout.leftBreakIndex]), drawdown.latestValue],
              symbol: "none",
            },
            {
              coord: [toAxisMonth(recoverDisplayMonth), drawdown.latestValue],
              symbol: "arrow",
            },
          ]);
          markLineData.push([
            {
              coord: [toAxisMonth(months[horizontalLayout.rightBreakIndex]), drawdown.latestValue],
              symbol: "none",
            },
            {
              coord: [toAxisMonth(drawdown.latestMonth), drawdown.latestValue],
              symbol: "arrow",
            },
          ]);
          markPointData.push({
            coord: [toAxisMonth(months[labelCenterIndex]), drawdown.latestValue],
            symbol: "circle",
            symbolSize: 2,
            itemStyle: {
              color: "rgba(0,0,0,0)",
              borderColor: "rgba(0,0,0,0)",
              borderWidth: 0,
            },
            label: {
              show: true,
              position: "inside",
              distance: 0,
              align: "center",
              verticalAlign: "middle",
              color: item.color,
              fontFamily: CHART_FONT_FAMILY,
              fontSize: recoverLabelFontSize,
              fontWeight: 700,
              backgroundColor: chartTextMaskColor,
              padding: recoverLabelPadding,
              formatter: recoverLabelText,
            },
          });
          const recoverCoord = toPixelCoord(months[labelCenterIndex], drawdown.latestValue);
          if (recoverCoord) {
            occupiedRecoverLabelRects.push(
              buildLabelRect({
                anchorX: recoverCoord.x,
                anchorY: recoverCoord.y,
                width: recoverLabelBox.width + 8,
                height: recoverLabelBox.height + 6,
                position: "inside",
              }),
            );
          }
        }
      }

      const endLabelMainText = item.endLabelMain || item.name;
      const endLabelSubText = item.endLabelSub || "";
      const endLabelBoxWidth = endLabelSubText
        ? Math.max(compactMobile ? 64 : 78, Math.round(endLabelFontSize * (compactMobile ? 4.4 : 5.2)))
        : null;

      return {
        name: item.name,
        type: "line",
        triggerLineEvent: true,
        data: item.normalized,
        smooth: 0.15,
        showSymbol: false,
        connectNulls: false,
        lineStyle: {
          width: seriesLineWidth * (item.lineWidthScale || 1),
          color: item.color,
          type: item.lineType || "solid",
          opacity: item.lineOpacity ?? 1,
        },
        itemStyle: {
          color: item.color,
        },
        endLabel: {
          show: true,
          position: "right",
          distance: endLabelSubText ? (compactMobile ? 3 : 5) : (compactMobile ? 6 : 12),
          offset: endLabelSubText ? (compactMobile ? [-14, 0] : [-24, 0]) : (compactMobile ? [-2, 0] : [-6, 0]),
          formatter() {
            if (endLabelSubText) {
              return `{main|${endLabelMainText}}\n{sub|${endLabelSubText}}`;
            }
            return `{main|${endLabelMainText}}`;
          },
          align: "left",
          color: item.color,
          fontFamily: CHART_FONT_FAMILY,
          fontSize: endLabelFontSize,
          backgroundColor: endLabelSubText ? "rgba(0,0,0,0)" : chartTextMaskColor,
          padding: item.endLabelSub ? [2, 5] : [1, 5],
          rich: {
            main: {
              color: item.color,
              fontFamily: CHART_FONT_FAMILY,
              fontWeight: endLabelMainWeight,
              textBorderColor: item.color,
              textBorderWidth: endLabelStrokeWidth,
              width: endLabelBoxWidth || undefined,
              align: endLabelSubText ? "center" : "left",
              fontSize: Math.max(
                compactMobile ? 8.6 : 10,
                Math.round(endLabelFontSize * (item.endLabelMainScale || 1)),
              ),
              lineHeight: Math.max(
                compactMobile ? 10 : 13,
                Math.round(endLabelFontSize * (item.endLabelMainScale || 1) * 1.08),
              ),
            },
            sub: {
              color: item.color,
              fontFamily: CHART_FONT_FAMILY,
              fontWeight: endLabelSubWeight,
              textBorderColor: item.color,
              textBorderWidth: endLabelStrokeWidth,
              width: endLabelBoxWidth || undefined,
              align: endLabelSubText ? "center" : "left",
              fontSize: Math.max(
                compactMobile ? 6.8 : 8,
                Math.round(endLabelFontSize * (item.endLabelSubScale || 0.82)),
              ),
              lineHeight: Math.max(
                compactMobile ? 8 : 10,
                Math.round(endLabelFontSize * (item.endLabelSubScale || 0.82) * 1.05),
              ),
            },
          },
        },
        labelLayout: {
          moveOverlap: "shiftY",
        },
        markLine:
          markLineData.length > 0
            ? {
                lineStyle: {
                  type: "dashed",
                  width: markLineWidth,
                  color: item.color,
                  opacity: 1,
                },
                label: { show: false },
                data: markLineData,
                silent: true,
                symbolSize: markSymbolSize,
              }
            : undefined,
        markPoint:
          markPointData.length > 0
            ? {
                symbol: "circle",
                symbolSize: 2,
                itemStyle: {
                  color: "rgba(0,0,0,0)",
                  borderColor: "rgba(0,0,0,0)",
                  borderWidth: 0,
                },
                z: 9,
                silent: true,
                data: markPointData,
              }
            : undefined,
        emphasis: {
          focus: "none",
        },
      };
    }),
  };
}

function render() {
  syncChartViewport();
  latestRenderContext = null;
  const selectedCityIds = readSelectedCityIds();
  refreshCompareSourceControl({ keepSelection: true });
  const compareContext = resolveCompareContext(selectedCityIds);
  const requestedStartMonth = startMonthEl.value;
  const requestedEndMonth = endMonthEl.value;

  if (selectedCityIds.length === 0) {
    chart.clear();
    summaryBodyEl.innerHTML = "";
    footnoteEl.textContent = "";
    updateDrawdownButton(0);
    updateChartTableButton(0);
    renderChartStatsOverlay([], requestedStartMonth, requestedEndMonth);
    setStatus("请至少选择一个城市。", true);
    return;
  }

  if (selectedCityIds.length > MAX_SELECTED_CITY_COUNT) {
    setStatus(`一次最多选择 ${MAX_SELECTED_CITY_COUNT} 个城市，请减少勾选后再生成。`, true);
    return;
  }

  if (
    !requestedStartMonth ||
    !requestedEndMonth ||
    requestedStartMonth > requestedEndMonth
  ) {
    chart.clear();
    summaryBodyEl.innerHTML = "";
    footnoteEl.textContent = "";
    updateDrawdownButton(0);
    updateChartTableButton(0);
    renderChartStatsOverlay([], requestedStartMonth, requestedEndMonth);
    setStatus("时间区间无效，请确保起点不晚于终点。", true);
    return;
  }

  const requestedStartIndex = raw.dates.indexOf(requestedStartMonth);
  const requestedEndIndex = raw.dates.indexOf(requestedEndMonth);
  if (requestedStartIndex < 0 || requestedEndIndex < 0) {
    setStatus("时间索引错误，请重新选择区间。", true);
    return;
  }

  const effectiveRange = getSelectedEffectiveRange(selectedCityIds);

  if (!effectiveRange) {
    chart.clear();
    summaryBodyEl.innerHTML = "";
    footnoteEl.textContent = "";
    updateDrawdownButton(0);
    updateChartTableButton(0);
    renderChartStatsOverlay([], requestedStartMonth, requestedEndMonth);
    setStatus("所选城市不存在可用的有效数据区间。", true);
    return;
  }

  let startIndex = requestedStartIndex;
  let endIndex = requestedEndIndex;
  let wasAutoAdjusted = false;

  if (startIndex < effectiveRange.startIndex) {
    startIndex = effectiveRange.startIndex;
    wasAutoAdjusted = true;
  }
  if (endIndex > effectiveRange.endIndex) {
    endIndex = effectiveRange.endIndex;
    wasAutoAdjusted = true;
  }
  if (startIndex > endIndex) {
    startIndex = effectiveRange.startIndex;
    endIndex = effectiveRange.endIndex;
    wasAutoAdjusted = true;
  }

  const startMonth = raw.dates[startIndex];
  const endMonth = raw.dates[endIndex];
  if (wasAutoAdjusted) {
    startMonthEl.value = startMonth;
    endMonthEl.value = endMonth;
  }

  const months = raw.dates.slice(startIndex, endIndex + 1);
  const monthTokens = months.map((month) => normalizeMonthToken(month));
  const findMonthIndexByToken = (monthValue) => {
    const normalized = normalizeMonthToken(monthValue);
    if (!normalized) return -1;
    return monthTokens.findIndex((token) => token === normalized);
  };
  let viewportStartOffset = 0;
  let viewportEndOffset = months.length - 1;
  if (typeof uiState.zoomStartMonth === "string") {
    const idx = findMonthIndexByToken(uiState.zoomStartMonth);
    if (idx >= 0) viewportStartOffset = idx;
  }
  if (typeof uiState.zoomEndMonth === "string") {
    const idx = findMonthIndexByToken(uiState.zoomEndMonth);
    if (idx >= 0) viewportEndOffset = idx;
  }
  if (viewportStartOffset > viewportEndOffset) {
    viewportStartOffset = 0;
    viewportEndOffset = months.length - 1;
  }
  const viewportMonths = months.slice(viewportStartOffset, viewportEndOffset + 1);
  const viewportStartMonth = viewportMonths[0] || startMonth;
  const viewportEndMonth = viewportMonths[viewportMonths.length - 1] || endMonth;
  uiState.zoomStartMonth = normalizeMonthToken(viewportStartMonth) || viewportStartMonth;
  uiState.zoomEndMonth = normalizeMonthToken(viewportEndMonth) || viewportEndMonth;
  syncTimeZoomWidget(months, viewportStartMonth, viewportEndMonth);

  const rendered = [];
  const missingBase = [];
  const noDataCities = [];
  const summaryRows = [];
  let drawdownEligibleCount = 0;

  const activeSourceLegend = activeSourceMeta?.legendLabel || activeSourceMeta?.label || "当前源";
  const compareSourceLegend = compareContext?.source?.legendLabel || compareContext?.source?.label || "对比源";
  const selectedCityNames = selectedCityIds
    .map((cityId) => cityById.get(cityId)?.name)
    .filter((name) => Boolean(name));
  const selectedCityColorMap = buildSelectedCityColorMap(selectedCityNames, getCurrentThemeMode());
  let compareSeriesRendered = false;
  let compareAnchorInfo = null;

  function appendSeries({
    city,
    seriesRaw,
    sourceKey = activeSourceMeta?.key || "centaline6",
    sourceLabel = activeSourceMeta?.legendLabel || "中原",
    displayName,
    endLabelMain = displayName,
    endLabelSub = "",
    endLabelMainScale = 1,
    endLabelSubScale = 0.82,
    colorIndex,
    lineType = "solid",
    lineWidthScale = 1,
    lineOpacity = 1,
    allowAnnotations = true,
    normalizedSeries = null,
    summaryBaseRaw = null,
  }) {
    let baseRaw = seriesRaw[viewportStartOffset];
    let normalized = null;
    if (Array.isArray(normalizedSeries) && normalizedSeries.length === seriesRaw.length) {
      normalized = normalizedSeries.map((value) => (isFiniteNumber(value) ? value : null));
      if (isFiniteNumber(summaryBaseRaw)) {
        baseRaw = summaryBaseRaw;
      } else if (!isFiniteNumber(baseRaw) || baseRaw <= 0) {
        baseRaw = null;
      }
    } else {
      if (!isFiniteNumber(baseRaw) || baseRaw <= 0) {
        missingBase.push(displayName);
        return false;
      }
      normalized = seriesRaw.map((value) => {
        if (!isFiniteNumber(value)) return null;
        return (value / baseRaw) * 100;
      });
    }
    const viewportNormalized = normalized.slice(viewportStartOffset, viewportEndOffset + 1);

    const validValues = viewportNormalized.filter(isFiniteNumber);
    if (validValues.length === 0) {
      noDataCities.push(displayName);
    }

    const peakValue = validValues.length > 0 ? Math.max(...validValues) : null;
    const peakIndex = isFiniteNumber(peakValue)
      ? viewportNormalized.findIndex((v) => v === peakValue)
      : -1;
    const peakMonth = peakIndex >= 0 ? viewportMonths[peakIndex] : null;
    const latestIndex = getLastFiniteIndex(viewportNormalized);
    const { value: latestValue, date: latestDate } = getLastFiniteInfo(viewportNormalized, viewportMonths);
    const momPct =
      latestIndex > 0 ? calcPctChange(latestValue, viewportNormalized[latestIndex - 1]) : null;
    const yoyPct =
      latestIndex >= 12 ? calcPctChange(latestValue, viewportNormalized[latestIndex - 12]) : null;
    const drawdownFromPeakPct =
      isFiniteNumber(latestValue) && isFiniteNumber(peakValue)
        ? ((latestValue / peakValue) - 1) * 100
        : null;
    const localDrawdownAnalysis = findDrawdownAnalysis(viewportNormalized, viewportMonths);
    const drawdownAnalysis = localDrawdownAnalysis
      ? decorateDrawdownForViewport(
          localDrawdownAnalysis,
          normalized,
          months,
          viewportStartOffset,
          viewportEndOffset,
        )
      : null;
    if (allowAnnotations && drawdownAnalysis) {
      drawdownEligibleCount += 1;
    }

    const lineColor = getColor(city.name, colorIndex, selectedCityColorMap);
    rendered.push({
      id: city.id,
      name: displayName,
      endLabelMain,
      endLabelSub,
      endLabelMainScale,
      endLabelSubScale,
      color: lineColor,
      normalized,
      lineType,
      lineWidthScale,
      lineOpacity,
      peakMarker:
        uiState.showDrawdownAnalysis && allowAnnotations && peakMonth && isFiniteNumber(peakValue)
          ? {
              month: peakMonth,
              value: peakValue,
            }
          : null,
      drawdown: uiState.showDrawdownAnalysis && allowAnnotations ? drawdownAnalysis : null,
    });

    summaryRows.push({
      name: displayName,
      cityName: city.name,
      sourceKey,
      sourceLabel,
      baseRaw,
      peakValue,
      peakDate: peakMonth,
      latestValue,
      latestDate,
      momPct,
      yoyPct,
      drawdownFromPeakPct,
      recoverMonth: drawdownAnalysis?.recoverMonth || null,
    });
    return true;
  }

  selectedCityIds.forEach((cityId, idx) => {
    const city = cityById.get(cityId);
    const series = raw.values[cityId];
    if (!city || !Array.isArray(series)) return;

    const displayName =
      compareContext && selectedCityIds.length === 1 && city.name === compareContext.cityName
        ? `${city.name}（${activeSourceLegend}）`
        : city.name;

    appendSeries({
      city,
      seriesRaw: series.slice(startIndex, endIndex + 1),
      sourceKey: activeSourceMeta?.key || "centaline6",
      sourceLabel: activeSourceLegend,
      displayName,
      endLabelMain:
        compareContext && selectedCityIds.length === 1 && city.name === compareContext.cityName
          ? city.name
          : displayName,
      endLabelSub:
        compareContext && selectedCityIds.length === 1 && city.name === compareContext.cityName
          ? `（${activeSourceLegend}）`
          : "",
      endLabelMainScale:
        compareContext && selectedCityIds.length === 1 && city.name === compareContext.cityName
          ? 0.92
          : 1,
      endLabelSubScale:
        compareContext && selectedCityIds.length === 1 && city.name === compareContext.cityName
          ? 0.72
          : 0.82,
      colorIndex: idx,
      lineType: "solid",
      lineWidthScale: 1,
      lineOpacity: 1,
      allowAnnotations: true,
    });
  });

  if (compareContext) {
    const compareSeries = compareContext.source?.data?.values?.[compareContext.city.id];
    if (Array.isArray(compareSeries)) {
      const compareSeriesByMonths = alignSeriesByMonths(compareContext.source.data, compareSeries, months);
      let normalizedCompareSeries = null;
      const compareStartRaw = compareSeriesByMonths[viewportStartOffset];

      if (!isFiniteNumber(compareStartRaw) || compareStartRaw <= 0) {
        const activeSeriesRendered = rendered.find((item) => item.id === selectedCityIds[0]);
        if (activeSeriesRendered && Array.isArray(activeSeriesRendered.normalized)) {
          const anchored = buildAnchoredCompareSeries(
            compareSeriesByMonths,
            activeSeriesRendered.normalized,
            months,
            "2008-01",
          );
          if (anchored) {
            normalizedCompareSeries = anchored.normalized;
            compareAnchorInfo = {
              month: anchored.anchorMonth,
              value: anchored.targetAnchorValue,
            };
          }
        }
      }

      compareSeriesRendered = appendSeries({
        city: compareContext.city,
        seriesRaw: compareSeriesByMonths,
        sourceKey: compareContext.source.key,
        sourceLabel: compareSourceLegend,
        displayName: `${compareContext.cityName}（${compareSourceLegend}）`,
        endLabelMain: compareContext.cityName,
        endLabelSub: `（${compareSourceLegend}）`,
        endLabelMainScale: 0.92,
        endLabelSubScale: 0.72,
        colorIndex: selectedCityIds.length + 1,
        lineType: "dashed",
        lineWidthScale: 0.94,
        lineOpacity: 0.96,
        allowAnnotations: true,
        normalizedSeries: normalizedCompareSeries,
      });
    }
  }

  if (rendered.length === 0) {
    chart.clear();
    summaryBodyEl.innerHTML = "";
    footnoteEl.textContent = "";
    updateDrawdownButton(0);
    updateChartTableButton(0);
    renderChartStatsOverlay([], viewportStartMonth, viewportEndMonth);
    setStatus("所选城市在起点月份没有可用数据，无法按统一起点定基。", true);
    return;
  }

  const renderedNameSet = new Set(rendered.map((item) => item.name));
  uiState.hiddenCityNames = new Set(
    [...uiState.hiddenCityNames].filter((name) => renderedNameSet.has(name)),
  );
  const visibleSummaryRows = summaryRows;
  latestRenderContext = {
    startMonth: viewportStartMonth,
    endMonth: viewportEndMonth,
    visibleSummaryRows,
  };

  updateDrawdownButton(drawdownEligibleCount);
  updateChartTableButton(rendered.length);

  isApplyingOption = true;
  chart.setOption(
    makeOption(
      rendered,
      months,
      startMonth,
      endMonth,
      uiState.hiddenCityNames,
      viewportStartMonth,
      viewportEndMonth,
    ),
    { notMerge: true, lazyUpdate: false },
  );
  isApplyingOption = false;
  for (let i = 0; i < rendered.length; i += 1) {
    chart.dispatchAction({ type: "downplay", seriesIndex: i });
  }
  chart.dispatchAction({ type: "hideTip" });
  chart.dispatchAction({ type: "updateAxisPointer", currTrigger: "leave" });
  chartTitleEl.textContent = `热点城市二手房价格走势图`;
  const sourceLabelShort = activeSourceMeta?.label || "中原领先指数（6城）";
  const compareMetaText =
    compareContext && compareSeriesRendered
      ? ` | 对比 ${compareContext.cityName}（${activeSourceLegend} vs ${compareSourceLegend}）`
      : "";
  const compareAnchorMetaText =
    compareContext && compareSeriesRendered && compareAnchorInfo?.month
      ? `（对比源按 ${compareAnchorInfo.month} 与${activeSourceLegend}对齐）`
      : "";
  chartMetaEl.textContent = `${formatMonthZh(viewportStartMonth)} - ${formatMonthZh(viewportEndMonth)} | 定基 ${formatMonthZh(viewportStartMonth)} = 100 | ${sourceLabelShort}${compareMetaText}${compareAnchorMetaText}`;

  renderSummaryTable(visibleSummaryRows);
  renderChartStatsOverlay(visibleSummaryRows, viewportStartMonth, viewportEndMonth);

  const missingText = missingBase.length > 0
    ? `以下城市因起点无有效值未纳入绘图：${missingBase.join("、")}。`
    : "";
  const noDataText = noDataCities.length > 0
    ? `以下城市在当前区间暂无有效值：${noDataCities.join("、")}。`
    : "";
  const modeText = `已按滑块起点 ${viewportStartMonth} 统一定基 100。`;
  const analysisText = uiState.showDrawdownAnalysis && drawdownEligibleCount > 0
    ? "已显示累计跌幅与跌回示意。"
    : "";
  const compareText =
    compareContext && compareSeriesRendered
      ? `已开启 ${compareContext.cityName} 跨源对比（${activeSourceLegend} vs ${compareSourceLegend}）。`
      : "";
  const compareAnchorText =
    compareContext && compareSeriesRendered && compareAnchorInfo?.month
      ? `对比源在 ${compareAnchorInfo.month} 与${activeSourceLegend}对齐后再展开。`
      : "";
  const sourceLabel = activeSourceMeta?.sourceTitle || "中原领先指数（月度）";
  footnoteEl.textContent = `数据源：${sourceLabel}。${modeText}${compareText}${compareAnchorText}当前滑块区间：${viewportStartMonth} ~ ${viewportEndMonth}。${analysisText}${missingText}${noDataText}`;

  const compareStatusText =
    compareContext && compareSeriesRendered
      ? `，并已对比 ${compareContext.cityName}（${activeSourceLegend} vs ${compareSourceLegend}）`
      : "";
  const compareAnchorStatusText =
    compareContext && compareSeriesRendered && compareAnchorInfo?.month
      ? `，对比源按 ${compareAnchorInfo.month} 与${activeSourceLegend}对齐`
      : "";
  const statusMessage = wasAutoAdjusted
    ? `你选择的区间超出有效数据范围，已自动调整为 ${startMonth} ~ ${endMonth}；当前滑块区间 ${viewportStartMonth} ~ ${viewportEndMonth}（定基 ${viewportStartMonth}=100）${compareStatusText}${compareAnchorStatusText}。`
    : `已生成 ${rendered.length} 条走势（当前滑块区间 ${viewportStartMonth} ~ ${viewportEndMonth}，定基 ${viewportStartMonth}=100）${compareStatusText}${compareAnchorStatusText}。`;
  setStatus(statusMessage, false);
}

function bindEvents() {
  if (themeModeEl) {
    themeModeEl.addEventListener("change", () => {
      applyThemeMode(themeModeEl.value, { persist: true, rerender: true });
    });
  }

  if (dataSourceEl) {
    dataSourceEl.addEventListener("change", () => {
      const applied = applyDataSource(dataSourceEl.value);
      if (!applied) {
        setStatus("数据源切换失败，请刷新重试。", true);
        return;
      }
      render();
    });
  }

  if (compareSourceEl) {
    compareSourceEl.addEventListener("change", () => {
      refreshCompareSourceControl({ keepSelection: true });
      render();
    });
  }

  renderBtn.addEventListener("click", () => {
    uiState.hiddenCityNames.clear();
    render();
  });

  drawdownBtn.addEventListener("click", () => {
    if (drawdownBtn.disabled) return;
    uiState.showDrawdownAnalysis = !uiState.showDrawdownAnalysis;
    render();
  });

  chartTableBtn.addEventListener("click", () => {
    if (chartTableBtn.disabled) return;
    uiState.showChartTable = !uiState.showChartTable;
    render();
  });

  chart.on("click", (params) => {
    if (params?.componentType === "series" && params?.seriesName) {
      const cityName = params.seriesName;
      const nextHidden = !uiState.hiddenCityNames.has(cityName);
      toggleCityVisibility(cityName);
      chart.dispatchAction({
        type: nextHidden ? "legendUnSelect" : "legendSelect",
        name: cityName,
      });
      return;
    }
  });

  chart.on("legendselectchanged", (params) => {
    if (isApplyingOption) return;
    const hidden = new Set();
    for (const [name, selected] of Object.entries(params.selected || {})) {
      if (!selected) hidden.add(name);
    }
    uiState.hiddenCityNames = hidden;
  });

  if (timeZoomStartEl && timeZoomEndEl) {
    timeZoomStartEl.addEventListener("input", () => {
      applyTimeZoomFromInputs("start");
    });
    timeZoomEndEl.addEventListener("input", () => {
      applyTimeZoomFromInputs("end");
    });
    timeZoomStartEl.addEventListener("change", () => {
      applyTimeZoomFromInputs("start");
    });
    timeZoomEndEl.addEventListener("change", () => {
      applyTimeZoomFromInputs("end");
    });
  }

  if (citySearchInputEl) {
    citySearchInputEl.addEventListener("input", () => {
      applyCitySearchFilter();
    });
    citySearchInputEl.addEventListener("search", () => {
      applyCitySearchFilter();
    });
  }

  cityListEl.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;

    const passed = enforceCitySelectionLimit(target);
    refreshCompareSourceControl({ keepSelection: true });
    if (!passed) {
      setStatus(`一次最多选择 ${MAX_SELECTED_CITY_COUNT} 个城市。`, true);
    }
  });

  selectAllBtn.addEventListener("click", () => {
    const allInputs = collectCityCheckboxInputs();
    const visibleInputs = collectCityCheckboxInputs({ visibleOnly: true });
    const hasActiveSearch = Boolean(citySearchInputEl && String(citySearchInputEl.value || "").trim());
    const targetInputs = visibleInputs.length > 0 ? visibleInputs : allInputs;
    const selectedCount = Math.min(MAX_SELECTED_CITY_COUNT, targetInputs.length);

    allInputs.forEach((input) => {
      input.checked = false;
    });
    for (let i = 0; i < selectedCount; i += 1) {
      targetInputs[i].checked = true;
    }

    syncCitySelectionCapacityUi();
    refreshCompareSourceControl({ keepSelection: true });
    if (selectedCount === 0 && hasActiveSearch) {
      setStatus("当前筛选结果没有可选城市。", true);
      return;
    }
    if (hasActiveSearch) {
      setStatus(`已按筛选结果选择 ${selectedCount} 个城市。`, false);
      return;
    }
    setStatus(`已选择前 ${selectedCount} 个城市。`, false);
  });

  clearAllBtn.addEventListener("click", () => {
    cityListEl.querySelectorAll('input[type="checkbox"]').forEach((el) => {
      el.checked = false;
    });
    syncCitySelectionCapacityUi();
    refreshCompareSourceControl({ keepSelection: false });
  });

  startMonthEl.addEventListener("change", () => {
    if (startMonthEl.value > endMonthEl.value) endMonthEl.value = startMonthEl.value;
    syncTimeZoomWidgetFromMonthSelects();
  });

  endMonthEl.addEventListener("change", () => {
    if (endMonthEl.value < startMonthEl.value) startMonthEl.value = endMonthEl.value;
    syncTimeZoomWidgetFromMonthSelects();
  });

  window.addEventListener("resize", () => {
    syncChartViewport();
    if (resizeRenderTimer) {
      clearTimeout(resizeRenderTimer);
      resizeRenderTimer = null;
    }
    resizeRenderTimer = setTimeout(() => {
      render();
    }, 120);
  });
}

async function init() {
  const availableSources = listAvailableSources();
  if (availableSources.length === 0) {
    setStatus("数据加载失败，请先生成 house-price-data.js / house-price-data-nbs-70.js。", true);
    return;
  }

  applyThemeMode(readStoredThemeMode(), { persist: false, rerender: false });

  populateSourceSelector(availableSources);
  const defaultSource =
    availableSources.find((source) => source.key === "centaline6") || availableSources[0];
  const applied = applyDataSource(defaultSource.key);
  if (!applied) {
    setStatus("初始化数据源失败，请刷新页面重试。", true);
    return;
  }

  bindEvents();
  bindChartWheelToPageScroll();
  await waitForChartFonts();
  render();
}

init();
