# 任务计划 v1

- task_id: T-20260330122617012-uh9ahn-tobacco-monotonicity-frontend
- 标题: tobacco-monotonicity-frontend
- lane: planned_build
- status: approved
- approved_at: 2026-03-30T20:40:00+08:00

## 计划总览

- 目标：交付单页高质感数据工作台，完成本地 Excel 导入、三十档到一档单调不增校验、违规高亮与明细查看，并提供可复现的失败样例。
- batch 数量：4
- 顺序原则：先建立可运行骨架，再锁定 Excel 解析与校验逻辑，随后完成结果展示与交互，最后再做高保真视觉和收尾验证。

## Batch 列表

### B1 `frontend-shell-and-workbench-frame`

- goal: 初始化前端工程，建立单页工作台骨架、主题变量、基础布局和本地示例数据流占位。
- scope:
  - 搭建 Vite + React + TypeScript 前端工程。
  - 建立单页工作台结构：品牌头部、导入区、摘要区、规则说明区、分析区、结果区、详情区占位。
  - 建立主题样式变量、基础资源目录和核心类型骨架。
- non_goals:
  - 不接入真实 Excel 解析。
  - 不实现最终图表与违规联动。
  - 不做完整视觉打磨。
- allowed_paths:
  - `package.json`
  - `package-lock.json`
  - `tsconfig*.json`
  - `vite.config.*`
  - `index.html`
  - `src/**`
  - `public/**`
  - `.gitignore`
- acceptance_checks:
  - `npm install`
  - `npm run build`
- done_when:
  - 前端项目可构建。
  - 页面具备高质感工作台骨架，能承接后续真实数据。
  - 核心组件与类型边界清晰，无后端依赖。
- risk_notes:
  - 避免先做成通用后台模板导致后续大改。
  - 视觉表达要有主题方向，但不能在此 batch 过度消耗时间。
- tdd_required: false
- delegate_policy: 不允许实现型子代理
- checkpoint_commit_boundary: 页面骨架可构建并通过 build 后提交一次。

### B2 `excel-parse-and-monotonic-analysis`

- goal: 接入本地 Excel 导入、单 sheet 解析、列识别、数值归一化和单调不增校验逻辑。
- scope:
  - 接入文件上传与 `xlsx` 本地读取。
  - 校验当前模板表头结构。
  - 生成行级分析结果、违规明细和汇总指标。
  - 为当前无违规样例的情况准备 synthetic failing case，并用它验证逻辑。
- non_goals:
  - 不做完整视觉润色。
  - 不做复杂详情交互。
  - 不扩展到通用任意模板识别。
- allowed_paths:
  - `src/**`
  - `package.json`
  - `package-lock.json`
  - `vitest.config.*`
  - `tests/**`
- acceptance_checks:
  - `npm run build`
  - `npm test`
  - 使用真实样例 Excel 成功解析
  - 使用 synthetic failing case 成功产出至少一条违规记录
- done_when:
  - 能导入当前样例文件并输出分析结果。
  - 能识别 `三十档` 到 `一档` 的顺序关系。
  - 每行都能给出 `isValid`、`violations`、`rankValues` 等结构化结果。
  - 对空值按 0 处理的规则已被明确实现并验证。
- risk_notes:
  - 这是最高风险 batch，必须额外小心，优先保证模板识别、数值清洗和违规对定位的正确性。
  - 当前样例无违规，不能只拿真实样例通过就算完成，必须以 synthetic failing case 证明高亮链路可被触发。
  - 分析逻辑与 UI 展示必须保持单一数据源，避免后续 B3 重写规则。
- tdd_required: true
- delegate_policy: 不允许实现型子代理
- checkpoint_commit_boundary: 解析和分析逻辑稳定，且失败样例验证通过后提交一次。

### B3 `results-table-filter-and-violation-detail`

- goal: 把分析结果完整接到页面上，完成表格展示、违规高亮、筛选模式和详情查看。
- scope:
  - 展示摘要指标。
  - 支持“全部 / 仅违规”筛选。
  - 实现违规行视觉标记。
  - 实现违规详情抽屉或侧栏。
  - 处理解析失败、空状态和切换状态反馈。
- non_goals:
  - 不追求最终品牌级视觉润色。
  - 不做复杂导出能力。
- allowed_paths:
  - `src/**`
  - `public/**`
- acceptance_checks:
  - `npm run build`
  - 手动验证导入后可筛选违规项并查看具体违规档位对
- done_when:
  - 用户能完成“导入 -> 看汇总 -> 找违规 -> 看详情”的主流程。
  - 违规行高亮与详情信息一致。
  - 样例与 synthetic failing case 都能在界面中正确展示。
- risk_notes:
  - 表格可读性和高亮密度要平衡。
  - 详情区不能另起一套判断逻辑，必须复用 B2 的分析结果。
- tdd_required: false
- delegate_policy: 可委托独立 UI 组件实现，但不得改分析逻辑
- checkpoint_commit_boundary: 主流程完整可演示后提交一次。

### B4 `premium-visual-polish-and-release-verification`

- goal: 完成高保真视觉、轻量图表表达、演示素材与最终验收，达到 spec 中的产品完成度。
- scope:
  - 完成 Hero 区与品牌字标。
  - 收敛配色、纹理、图片位和关键指标卡样式。
  - 补充必要的轻量图表或可视化表达。
  - 准备可直接演示的失败样例入口或内置 demo。
  - 完成最终 review、verification 和必要文档补充。
- non_goals:
  - 不扩展为多页面。
  - 不加入后端、登录、权限或持久化。
- allowed_paths:
  - `src/**`
  - `public/**`
  - `README.md`
  - `.codex/state/tasks/**`
- acceptance_checks:
  - `npm run build`
  - 全流程手测
  - synthetic failing case 可复现违规高亮
  - review 与 verification 产物齐全
- done_when:
  - 页面在桌面端具备明确的烟草行业主题视觉。
  - 核心主流程稳定可演示。
  - synthetic failing case 能直接证明违规检测与高亮效果。
  - 满足 spec.v1 的 Done When。
- risk_notes:
  - 视觉打磨不能盖过信息层次和业务主流程。
  - 图表必须服务分析，不做喧宾夺主的装饰。
- tdd_required: false
- delegate_policy: 可委托独立视觉展示组件，但不得改变业务边界
- checkpoint_commit_boundary: 最终 review/verification 前提交一次。

## 风险与回退

- 最可能失效的 batch：`B2`
- 失败类型判断：
  - 若是解析实现缺陷、测试失败或样例处理错误：回 `$execute-batch-zh`
  - 若发现模板结构、空值规则或违规定义仍不够闭合：回 `$brainstorm-zh`
  - 若发现 batch 边界不合理、acceptance checks 无法证明需求满足：进 `$replan-zh`

## 执行纪律

- 每个 batch 完成后必须记录 checkpoint 与 Git commit。
- 未激活 batch 前，不得提前进入实现。
- `B2` 为高风险批次，执行时应先验证真实样例与 synthetic failing case，再继续 UI 联动。

## 当前结论

- 该计划已获用户批准。
- 下一步技能：`$milestone-contract-zh`
