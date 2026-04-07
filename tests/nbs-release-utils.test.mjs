import test from "node:test";
import assert from "node:assert/strict";

import {
  applyOfficialRelease,
  parseOfficialReleaseSecondhandMomTable,
  parseReleaseListPage,
} from "../scripts/nbs-release-utils.mjs";

function buildListingHtml() {
  return `
    <html>
      <body>
        <ul>
          <li>
            <a href="./202604/t20260403_1962983.html" title="2026年3月下旬流通领域重要生产资料市场价格变动情况">
              2026年3月下旬流通领域重要生产资料市场价格变动情况
            </a>
          </li>
          <li>
            <a href="./202603/t20260316_1962774.html" title="2026年2月份70个大中城市商品住宅销售价格变动情况">
              2026年2月份70个大中城市商品住宅销售价格变动情况
            </a>
          </li>
          <li>
            <a href="./202602/t20260219_1962501.html" title="2026年1月份70个大中城市商品住宅销售价格变动情况">
              2026年1月份70个大中城市商品住宅销售价格变动情况
            </a>
          </li>
        </ul>
        <script>
          createPageHTML(67, 0, "index", "html");
        </script>
      </body>
    </html>
  `;
}

function buildSecondhandReleaseHtml() {
  const cityGroups = [
    ["北京", 100.3],
    ["天津", 99.5],
    ["石家庄", 99.6],
    ["太原", 99.5],
    ["呼和浩特", 99.6],
    ["沈阳", 99.8],
    ["大连", 99.7],
    ["长春", 99.4],
    ["哈尔滨", 99.3],
    ["上海", 99.8],
    ["南京", 99.5],
    ["杭州", 99.2],
    ["宁波", 99.4],
    ["合肥", 99.6],
    ["福州", 99.7],
    ["厦门", 99.9],
    ["南昌", 99.3],
    ["济南", 99.4],
    ["青岛", 99.5],
    ["郑州", 99.1],
    ["武汉", 99.2],
    ["长沙", 99.6],
    ["广州", 99.7],
    ["深圳", 100.1],
    ["南宁", 99.8],
    ["海口", 100.0],
    ["重庆", 99.4],
    ["成都", 99.3],
    ["贵阳", 99.2],
    ["昆明", 99.1],
    ["西安", 99.5],
    ["兰州", 99.2],
    ["西宁", 99.6],
    ["银川", 99.0],
    ["乌鲁木齐", 99.7],
    ["唐山", 99.3],
    ["秦皇岛", 99.2],
    ["包头", 99.4],
    ["丹东", 99.8],
    ["锦州", 99.1],
    ["吉林", 99.0],
    ["牡丹江", 99.4],
    ["无锡", 99.5],
    ["扬州", 99.3],
    ["徐州", 99.2],
    ["温州", 99.4],
    ["金华", 99.6],
    ["蚌埠", 99.1],
    ["安庆", 99.0],
    ["泉州", 99.7],
    ["九江", 99.8],
    ["赣州", 99.2],
    ["烟台", 99.1],
    ["济宁", 99.0],
    ["洛阳", 99.3],
    ["平顶山", 99.4],
    ["宜昌", 99.2],
    ["襄阳", 99.5],
    ["岳阳", 99.3],
    ["常德", 99.1],
    ["惠州", 99.8],
    ["湛江", 99.0],
    ["韶关", 99.2],
    ["桂林", 99.4],
    ["北海", 99.3],
    ["三亚", 100.2],
    ["泸州", 99.1],
    ["南充", 99.0],
    ["遵义", 99.2],
    ["大理", 99.3],
  ];

  const rows = [];
  for (let index = 0; index < cityGroups.length; index += 2) {
    const left = cityGroups[index];
    const right = cityGroups[index + 1];
    rows.push(`
      <tr>
        <td>${left[0]}</td>
        <td>${left[1]}</td>
        <td>95.0</td>
        <td>95.1</td>
        <td>${right[0]}</td>
        <td>${right[1]}</td>
        <td>94.0</td>
        <td>94.2</td>
      </tr>
    `);
  }

  return `
    <html>
      <head>
        <meta name="ArticleTitle" content="2026年2月份70个大中城市商品住宅销售价格变动情况" />
      </head>
      <body>
        <table><tr><td>placeholder</td></tr></table>
        <table>
          <tr>
            <th rowspan="2">城市</th>
            <th colspan="3">环比</th>
            <th rowspan="2">城市</th>
            <th colspan="3">环比</th>
          </tr>
          <tr>
            <th>上月=100</th>
            <th>上年同月=100</th>
            <th>上年同期=100</th>
            <th>上月=100</th>
            <th>上年同月=100</th>
            <th>上年同期=100</th>
          </tr>
          ${rows.join("\n")}
        </table>
      </body>
    </html>
  `;
}

test("parseReleaseListPage extracts page count and housing release entries", () => {
  const result = parseReleaseListPage(
    buildListingHtml(),
    "https://www.stats.gov.cn/sj/zxfb/",
  );

  assert.equal(result.pageCount, 67);
  assert.deepEqual(
    result.entries.map((entry) => ({
      month: entry.month,
      url: entry.url,
    })),
    [
      {
        month: "2026-02",
        url: "https://www.stats.gov.cn/sj/zxfb/202603/t20260316_1962774.html",
      },
      {
        month: "2026-01",
        url: "https://www.stats.gov.cn/sj/zxfb/202602/t20260219_1962501.html",
      },
    ],
  );
});

test("parseOfficialReleaseSecondhandMomTable reads 70-city secondhand month-over-month values", () => {
  const momByCity = parseOfficialReleaseSecondhandMomTable(buildSecondhandReleaseHtml());

  assert.equal(momByCity.size, 70);
  assert.equal(momByCity.get("北京"), 100.3);
  assert.equal(momByCity.get("深圳"), 100.1);
  assert.equal(momByCity.get("三亚"), 100.2);
});

test("applyOfficialRelease appends a new month and updates chained values", () => {
  const existing = {
    dates: ["2026-01"],
    rowsParsed: 1,
    outputMaxMonth: "2026-01",
    latestMonthFromOfficialRelease: "2026-01",
    cities: [
      {
        id: "city_nbs_110000",
        name: "北京",
        availableRange: "2026-01:2026-01",
        updatedAt: "2026-01",
      },
      {
        id: "city_nbs_310000",
        name: "上海",
        availableRange: "2026-01:2026-01",
        updatedAt: "2026-01",
      },
    ],
    values: {
      city_nbs_110000: [100],
      city_nbs_310000: [200],
    },
  };

  const updated = applyOfficialRelease(existing, {
    month: "2026-02",
    url: "https://www.stats.gov.cn/sj/zxfb/202603/t20260316_1962774.html",
    momByCity: new Map([
      ["北京", 100.3],
      ["上海", 99.8],
    ]),
  });

  assert.deepEqual(updated.dates, ["2026-01", "2026-02"]);
  assert.deepEqual(updated.values.city_nbs_110000, [100, 100.3]);
  assert.deepEqual(updated.values.city_nbs_310000, [200, 199.6]);
  assert.equal(updated.cities[0].availableRange, "2026-01:2026-02");
  assert.equal(updated.cities[0].updatedAt, "2026-02");
  assert.equal(updated.rowsParsed, 2);
  assert.equal(updated.outputMaxMonth, "2026-02");
  assert.equal(updated.latestMonthFromOfficialRelease, "2026-02");
  assert.equal(
    updated.officialReleaseUrl,
    "https://www.stats.gov.cn/sj/zxfb/202603/t20260316_1962774.html",
  );
});
