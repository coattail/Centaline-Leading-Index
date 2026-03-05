# 房价可视化（Centaline-Leading-Index）

[English README](./README.en.md)

一个面向研究与内容创作的中国二手住宅价格可视化项目。项目采用**纯前端静态架构**（无打包构建依赖），支持双数据源切换、区间重定基、跨源对比、图内统计表、高清导出，以及移动端适配。

---

## 1. 项目定位

本项目用于回答两类常见问题：

- 不同城市在同一时间区间内的价格走势差异如何？
- 在同一城市维度下，不同数据源的走势差异如何？

适用场景：

- 房地产周期研究
- 宏观内容图表制作
- 城市间相对强弱观察

---

## 2. 核心功能

### 2.1 双数据源

- 中原领先指数（6城）
- 国家统计局（二手住宅 70 城）

### 2.2 图表交互

- 最多选择 6 个城市同时对比
- 图表下方独立时间滑块（双端拖拽）
- 时间区间下拉 + 滑块双向联动
- 浅色 / 深色主题切换

### 2.3 分析能力

- 区间重定基（起点 = 100）
- 累计跌幅分析（峰值、回撤、跌回）
- 跨源对比（单城市且满足规则时启用）
- 图内统计汇总表（可开关）

### 2.4 导出能力

- 标准清晰 PNG
- 超清 PNG
- 导出时自动隐藏工具图标与滑块等非核心控件，保证成图干净

### 2.5 近期维护更新（2026-02-27）

- 保持交互与视觉不变，更新聚焦于可维护性和安全性。
- 将响应式阈值与布局参数集中到统一常量（如 `RESPONSIVE_BREAKPOINTS`、`RESPONSIVE_GRID_LAYOUTS`、`RESPONSIVE_CHART_LAYOUTS`）。
- 下拉框与汇总表改为 DOM API（`createElement` / `textContent`）构建，降低动态 HTML 拼接风险。
- 图内统计表所有动态文本统一经过 `escapeHtml` 处理，减少潜在注入面。

---

## 3. 技术架构（通用版）

### 3.1 前端

- HTML / CSS / JavaScript（Vanilla）
- ECharts（本地 `vendor/echarts.min.js`）用于图表渲染
- html2canvas（CDN）用于页面态导出

### 3.2 数据组织

前端直接读取仓库内静态数据文件：

- `house-price-data.js`（中原主数据）
- `house-price-data-nbs-70.js`（统计局 70 城）
- 对应 JSON 产物用于校验/复用

### 3.3 更新策略

- 中原数据：人工喂数（可配合 Excel 提取脚本）
- 统计局数据：GitHub Actions 自动月更并提交数据文件

> 说明：即使有自动更新流程，线上页面依然是静态站点，不依赖后端实时接口。

---

## 4. 项目结构

```text
Centaline-Leading-Index/
├── index.html
├── style.css
├── app.js
├── fonts/
│   ├── STKaiti-full.woff2
│   ├── STKaiti-subset.woff2
│   └── STKaiti-subset-chars.txt
├── house-price-data.js
├── house-price-data.json
├── house-price-data-nbs-70.js
├── house-price-data-nbs-70.json
├── hk-centaline-monthly.json
├── vendor/
│   └── echarts.min.js
├── scripts/
│   ├── build-stkaiti-subset.py
│   ├── extract-house-price-data.mjs
│   ├── fetch-hk-centaline-monthly.mjs
│   └── fetch-nbs-70city-secondhand.mjs
├── README.md
└── README.en.md
```

---

## 5. 快速开始

### 5.1 环境要求

- Node.js 18+
- Python 3（用于本地静态服务）
- 建议使用现代浏览器（Chrome / Edge / Safari 最新版）

### 5.2 本地运行

```bash
git clone https://github.com/Sunny-1991/Centaline-Leading-Index.git
cd Centaline-Leading-Index
python3 -m http.server 9013
```

浏览器访问：

- <http://127.0.0.1:9013>

> 不建议直接用 `file://` 打开 `index.html`，可能触发资源加载限制。

### 5.3 本地访问排查（代理 / VPN 环境）

如果服务已启动但浏览器打不开本地地址，通常是代理软件拦截了本地流量。可先用以下命令临时绕过代理启动服务：

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY python3 -m http.server 9013 --bind 0.0.0.0
```

访问地址：

- 当前设备：<http://127.0.0.1:9013>
- 局域网其他设备：<http://你的局域网IP:9013>

---

## 6. 页面使用流程

1. 选择数据源（中原 / 统计局）
2. 勾选城市（最多 6 个）
3. 选择起止时间
4. 点击“一键生成”
5. 按需开启“累计跌幅”与“表格汇总”
6. 使用图表下方时间滑块做区间微调
7. 右上角导出标准图或超清图

---

## 7. 数据更新说明

### 7.1 香港月度数据（可选补充）

```bash
node scripts/fetch-hk-centaline-monthly.mjs
```

产物：`hk-centaline-monthly.json`

### 7.2 中原主数据（Excel 提取）

```bash
node scripts/extract-house-price-data.mjs <excel-file.xlsx>
```

产物：

- `house-price-data.js`
- `house-price-data.json`

### 7.3 统计局 70 城抓取与构建

```bash
node scripts/fetch-nbs-70city-secondhand.mjs
```

产物：

- `house-price-data-nbs-70.js`
- `house-price-data-nbs-70.json`

### 7.4 统计局 70 城一致性核查（只审计，不改值）

```bash
node scripts/audit-nbs-70city-secondhand.mjs house-price-data-nbs-70.json /tmp/nbs-audit-report.json
```

说明：

- 逐年回查国家统计局接口（`A010807`），核对本地链式序列是否与源值一致
- 输出长直线区间、单月大幅波动、源端 `0` 占位值、缺失值补位点
- `mismatchCount > 0` 时脚本会返回非零退出码，便于 CI/巡检告警

### 7.5 楷体子集字体重建（性能优化）

```bash
python3 scripts/build-stkaiti-subset.py
```

产物：

- `fonts/STKaiti-subset.woff2`
- `fonts/STKaiti-subset-chars.txt`

说明：

- 脚本会从 `index.html`、`app.js`、`style.css` 与数据文件提取字形集合，再生成子集字体
- 如缺依赖，请先执行：`python3 -m pip install --user fonttools brotli`

---

## 8. 统计局自动月更（GitHub Actions）

工作流文件：

- `.github/workflows/auto-update-nbs-data.yml`

触发方式：

- 每月定时执行（UTC）
- 手动触发 `workflow_dispatch`

行为：

1. 执行 `node scripts/fetch-nbs-70city-secondhand.mjs`
2. 检测数据文件是否变化
3. 有变化才自动提交并推送

自动更新覆盖统计局数据；中原付费数据建议继续人工更新。

---

## 9. 部署建议

### 9.1 GitHub Pages

本项目是纯静态站点，推送到仓库分支后即可部署。

至少保证以下文件位于站点根目录并可访问：

- `index.html`
- `style.css`
- `app.js`
- `house-price-data.js`
- `house-price-data-nbs-70.js`
- `vendor/echarts.min.js`
- `fonts/STKaiti-subset.woff2`

### 9.2 缓存刷新

样式或脚本变更后，如页面未及时生效：

- 强制刷新：`Cmd/Ctrl + Shift + R`
- 或更新 `index.html` 中资源版本参数（`?v=...`）

---

## 10. 常见问题（FAQ）

### Q1：页面一直显示“正在加载数据...”

- 请确认通过 `http://` 访问，而不是 `file://`
- 请确认 `house-price-data*.js` 文件存在且内容完整

### Q2：导出图与页面显示不一致

- 先点击“一键生成”后再导出
- 导出基于当前选择状态（城市、区间、分析开关）

### Q3：为什么有自动月更还叫静态网页？

- 自动月更只是“离线更新仓库数据文件”
- 页面运行时依然只加载静态 JS/JSON 文件，不依赖后端 API

### Q4：本地已启动服务但页面仍打不开？

- 先检查代理规则，确保 `localhost`、`127.0.0.1` 与局域网网段走直连。
- 用命令行验证服务是否可达：`curl --noproxy '*' -I http://127.0.0.1:9013`。
- 若命令可达而浏览器不可达，通常是浏览器代理规则未直连本地地址。

---

## 11. 合规与声明

- 数据可能受来源平台授权规则约束，请在合法合规前提下使用。
- 本项目主要用于研究、分析与交流，不构成投资或交易建议。
