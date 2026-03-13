# 房价可视化仪表盘（Centaline-Leading-Index）

[![NBS Auto Update](https://github.com/coattail/Centaline-Leading-Index/actions/workflows/auto-update-nbs-data.yml/badge.svg)](https://github.com/coattail/Centaline-Leading-Index/actions/workflows/auto-update-nbs-data.yml)
![Static Site](https://img.shields.io/badge/Architecture-Static%20Site-0ea5e9)
![ECharts 5](https://img.shields.io/badge/Chart-ECharts%205-22c55e)

[English](./README.en.md)

> 一个面向研究与内容创作的中国二手住宅价格分析看板。  
> 纯前端静态架构（无打包、无后端），支持双数据源切换、区间重定基、跨源对比、回撤分析和高清导出。

## 目录

- [核心能力](#核心能力)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [使用流程](#使用流程)
- [数据更新与脚本](#数据更新与脚本)
- [自动化月更（GitHub Actions）](#自动化月更github-actions)
- [项目结构](#项目结构)
- [常见问题（FAQ）](#常见问题faq)
- [合规与声明](#合规与声明)

## 核心能力

### 1) 数据源与覆盖

- **中原领先指数（6城）**：主数据来自本地 Excel 提取，可选叠加香港 CCL 月度序列。
- **国家统计局 70 城**：使用 NBS 官方接口抓取“上月=100”数据并链式定基。
- **双源统一体验**：前端以静态 `JS/JSON` 直接读取，不依赖运行时后端 API。

### 2) 图表交互与分析

- 最多同时选择 **6 个城市**对比。
- 统计局数据源支持“**城市 / 省份关键词**”搜索筛选。
- 时间下拉框与双端滑块联动，快速调整可视区间。
- 区间重定基（所选起点 = 100）。
- 累计跌幅分析：自动识别峰值、当前回撤和“跌回”节点（满足条件时可开启）。
- 跨源对比：仅在**单选且为北京/上海/广州/深圳/天津**时启用。
- 图内汇总表开关：同步展示峰值、最新值、回撤等关键指标。

### 3) 展示与导出

- 浅色 / 深色主题切换（主题偏好写入 `localStorage`）。
- 响应式布局，兼容桌面与移动端。
- 工具栏支持标准与超清 PNG 导出；导出时自动清理非核心控件，图面更干净。

## 技术架构

- **Frontend**：`index.html` + `style.css` + `app.js`（Vanilla JS）。
- **Chart Engine**：本地 `vendor/echarts.min.js`。
- **Export Pipeline**：优先使用 `html2canvas` 捕获页面态，失败时自动降级到 ECharts 导出路径。
- **Data Files**：`house-price-data.js`、`house-price-data-nbs-70.js` 及对应 JSON 快照。
- **Automation**：`.github/workflows/auto-update-nbs-data.yml` 每月自动更新 NBS 数据。

## 快速开始

### 环境要求

- Node.js 18+
- Python 3
- `curl`、`unzip`（用于数据脚本）
- 推荐浏览器：Chrome / Edge / Safari 最新版

### 本地运行

```bash
git clone https://github.com/coattail/Centaline-Leading-Index.git
cd Centaline-Leading-Index
python3 -m http.server 9013
```

浏览器访问：<http://127.0.0.1:9013>

> 不建议直接 `file://` 打开 `index.html`，可能触发浏览器资源限制。

### 本地访问异常（代理 / VPN）

若服务已启动但浏览器无法访问本地地址，可先临时绕开代理环境变量：

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY python3 -m http.server 9013 --bind 0.0.0.0
```

连通性自检：

```bash
curl --noproxy '*' -I http://127.0.0.1:9013
```

## 使用流程

1. 选择数据源（中原 / 统计局）。
2. 选择城市（最多 6 个）。
3. 选择起止时间并点击“一键生成”。
4. 按需开启“累计跌幅”与“表格汇总”。
5. 使用图下滑块微调区间。
6. 导出标准图或超清图。

## 数据更新与脚本

> 项目无构建步骤，数据更新后可直接刷新页面验证。

| 任务 | 命令 | 主要产物 |
| --- | --- | --- |
| 抓取香港中原月度数据（可选） | `node scripts/fetch-hk-centaline-monthly.mjs` | `hk-centaline-monthly.json` |
| 从 Excel 提取中原主数据 | `node scripts/extract-house-price-data.mjs <excel-file.xlsx>` | `house-price-data.js` / `house-price-data.json` |
| 抓取并构建 NBS 70 城链式数据 | `node scripts/fetch-nbs-70city-secondhand.mjs` | `house-price-data-nbs-70.js` / `house-price-data-nbs-70.json` |
| 审计 NBS 链式一致性（只校验不改值） | `node scripts/audit-nbs-70city-secondhand.mjs house-price-data-nbs-70.json /tmp/nbs-audit-report.json` | `/tmp/nbs-audit-report.json` |
| 重建楷体子集字体（性能优化） | `python3 scripts/build-stkaiti-subset.py` | `fonts/STKaiti-subset.woff2` / `fonts/STKaiti-subset-chars.txt` |

### NBS 脚本可选环境变量

- `NBS_OUTPUT_MIN_MONTH`：输出起始月（如 `2006-01`）
- `NBS_OUTPUT_BASE_MONTH`：统一定基月（如 `2006-01`）
- `NBS_OUTPUT_MAX_MONTH`：输出截止月（默认当前 UTC 月）

示例：

```bash
NBS_OUTPUT_MIN_MONTH=2008-01 \
NBS_OUTPUT_BASE_MONTH=2008-01 \
NBS_OUTPUT_MAX_MONTH=2026-01 \
node scripts/fetch-nbs-70city-secondhand.mjs
```

## 自动化月更（GitHub Actions）

工作流：`.github/workflows/auto-update-nbs-data.yml`

- 定时：每月 **UTC 02:30（6号）**
- 也支持手动 `workflow_dispatch`
- 自动流程只覆盖 NBS 数据：
  1. 运行 `node scripts/fetch-nbs-70city-secondhand.mjs`
  2. 检测 `house-price-data-nbs-70.js/.json` 是否有变化
  3. 有变化才自动提交并推送

> 中原付费数据仍建议手动更新并复核。

## 项目结构

```text
Centaline-Leading-Index/
├── index.html
├── style.css
├── app.js
├── house-price-data.js
├── house-price-data.json
├── house-price-data-nbs-70.js
├── house-price-data-nbs-70.json
├── hk-centaline-monthly.json
├── fonts/
├── scripts/
├── vendor/
├── .github/workflows/auto-update-nbs-data.yml
├── README.md
└── README.en.md
```

## 常见问题（FAQ）

### 页面一直显示“正在加载数据...”

- 请通过 `http://` 访问，不要直接 `file://` 打开。
- 检查 `house-price-data*.js` 文件是否完整且可加载。

### 为什么“跨源对比”是灰色？

- 仅在单选城市时可用。
- 城市需属于：北京、上海、广州、深圳、天津。

### 为什么“累计跌幅”按钮不可用？

- 仅当当前序列最新值较历史峰值回撤超过阈值时开放。

### 明明有自动更新，为什么仍是静态站点？

- 自动更新只是在仓库里离线更新数据文件。
- 页面运行时仍是纯静态资源加载，不依赖后端接口。

## 合规与声明

- 数据可能受来源平台授权与使用规则约束，请在合规前提下使用。
- 本项目用于研究、分析与交流，不构成投资建议。
