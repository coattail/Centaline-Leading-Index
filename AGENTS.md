# Project: House Price Dashboard

## Goal
维护一个静态网页仪表盘，用于展示热点城市二手房价格指数走势，并支持区间对比与回撤分析。

## Stack
- Static HTML/CSS/JavaScript
- ECharts (CDN)
- Local dataset in `house-price-data.js`

## Run
```bash
cd "/path/to/Centaline-Leading-Index"
python3 -m http.server 9013
```
Open `http://127.0.0.1:9013`.

## Data Workflow
- 提取本地 Excel 并更新数据：
```bash
cd "/path/to/Centaline-Leading-Index"
node scripts/extract-house-price-data.mjs "/path/to/your.xlsx"
```
- 拉取中原香港月度数据并合并：
```bash
cd "/path/to/Centaline-Leading-Index"
node scripts/fetch-hk-centaline-monthly.mjs
node scripts/extract-house-price-data.mjs "/path/to/your.xlsx"
```
- 拉取统计局 70 城并生成链式数据：
```bash
cd "/path/to/Centaline-Leading-Index"
node scripts/fetch-nbs-70city-secondhand.mjs
```

## File Map
- `index.html`: 页面结构和控件
- `style.css`: 页面样式和布局
- `app.js`: 图表渲染、交互逻辑、统计汇总
- `house-price-data.js`: 前端直接读取的数据
- `house-price-data.json`: 数据快照（便于检查）
- `hk-centaline-monthly.json`: 香港中原月度数据缓存
- `scripts/extract-house-price-data.mjs`: Excel 提取与合并脚本
- `scripts/fetch-hk-centaline-monthly.mjs`: 香港数据抓取脚本
- `scripts/fetch-nbs-70city-secondhand.mjs`: 统计局 70 城抓取与链式构建脚本

## Guardrails
- 保持项目为 build-free 的静态站点，不引入前端框架。
- 优先修改现有脚本与页面结构，避免重复实现数据处理逻辑。
- 默认维持中文界面文案，除非用户明确要求改为其他语言。

## 协作偏好
- 编码过程中实时输出简短进度播报，不要只在结尾总结。
- 使用统一状态标签：`正在做` / `发现` / `已完成` / `下一步`。
