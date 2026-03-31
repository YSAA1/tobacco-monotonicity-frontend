# Tobacco Monotonicity Frontend

中国烟草主题的数据前端工作台，支持本地导入 Excel，校验“三十档 -> 一档”是否满足单调不增，并在界面中高亮违规记录与违规档位对。

## 快速启动

```bash
npm install
npm run dev
```

生产构建与测试：

```bash
npm run build
npm test
```

## 核心能力

- 本地解析单 sheet 模板，浏览器内完成处理，无后端依赖。
- 解析后生成统一分析数据：`rows`、`violations`、`rankValues`。
- 结果表支持 `全部 / 仅违规 / 仅通过` 筛选。
- 违规行与选中行双重高亮，详情面板同步展示违规档位对。
- 支持一键加载 `synthetic failing case`，用于演示和回归验证。

## 演示流程（B4 验收）

1. 点击“加载 synthetic failing case”，确认出现违规高亮行。
2. 切换筛选模式，确认记录数变化与详情联动一致。
3. 点击任意违规行，确认详情面板展示对应违规档位对。
4. 导入真实样例文件，确认可解析并完成全流程查看。

## 说明

- 当前版本以模板兼容和主流程可演示为优先。
- 规则计算逻辑集中在 `src/lib/tobaccoWorkbook.ts`，界面层只消费分析结果，不重复实现规则。
