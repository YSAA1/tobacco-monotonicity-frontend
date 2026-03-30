import type { CSSProperties } from 'react'

type SummaryCard = {
  label: string
  value: string
  hint: string
}

type StageRow = {
  name: string
  status: string
  detail: string
}

type QueueItem = {
  title: string
  detail: string
}

const summaryCards: SummaryCard[] = [
  { label: '总记录数', value: '--', hint: '待 B2 接入真实 Excel 解析' },
  { label: '违规记录数', value: '--', hint: '当前批次只搭建展示骨架' },
  { label: '规则状态', value: '待校验', hint: '规则为三十档 >= ... >= 一档' },
  { label: '数据源', value: '本地上传', hint: '首版不依赖后端服务' },
]

const stageRows: StageRow[] = [
  { name: '模板导入', status: '待接入', detail: '当前批次提供上传入口与说明，不解析文件。' },
  { name: '规则分析', status: '待接入', detail: 'B2 将补充单调不增校验和失败样例验证。' },
  { name: '结果联动', status: '骨架就绪', detail: '表格、详情抽屉和指标卡已预留位置。' },
]

const queueItems: QueueItem[] = [
  { title: '模板要求', detail: '单 sheet、6 个元数据列、30 个档位列。' },
  { title: '视觉方向', detail: '深墨绿、赤金、米白和烟叶棕的行业工作台。' },
  { title: '当前边界', detail: '只做工作台框架，不提前实现解析和异常判断。' },
]

const tableColumns = ['商品编码', '商品名称', '批发价', '投放方式', '三十档', '二十档', '十档', '一档']

const placeholderRows = [
  ['待导入', '示例占位行', '--', '--', '--', '--', '--', '--'],
  ['待导入', '异常高亮将在 B3 接入', '--', '--', '--', '--', '--', '--'],
]

const heroGlowStyle: CSSProperties = {
  background:
    'radial-gradient(circle at top, rgba(220, 168, 92, 0.35), rgba(7, 24, 22, 0) 58%)',
}

function App() {
  return (
    <div className="app-shell">
      <div className="hero-glow" style={heroGlowStyle} />
      <header className="hero">
        <div className="hero-copy">
          <div className="brand-badge">
            <span className="badge-mark" />
            烟草数据工作台
          </div>
          <h1>档位单调性分析中枢</h1>
          <p className="hero-lead">
            面向投放模板的单页分析界面。当前批次完成高质感框架、信息结构与展示骨架，后续将接入本地
            Excel 解析与违规明细联动。
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button">
              导入模板文件
            </button>
            <button type="button" className="secondary-button">
              查看规则说明
            </button>
          </div>
        </div>
        <aside className="hero-panel">
          <div className="hero-panel-header">
            <span>场景总览</span>
            <strong>单页 Premium Workbench</strong>
          </div>
          <div className="hero-visual">
            <div className="visual-orbit visual-orbit-large" />
            <div className="visual-orbit visual-orbit-small" />
            <div className="visual-core">
              <span>30</span>
              <small>档位序列</small>
            </div>
          </div>
          <ul className="hero-metrics">
            <li>
              <span>工作模式</span>
              <strong>本地分析</strong>
            </li>
            <li>
              <span>模板范围</span>
              <strong>单表单模板</strong>
            </li>
            <li>
              <span>当前批次</span>
              <strong>B1 页面骨架</strong>
            </li>
          </ul>
        </aside>
      </header>

      <main className="workspace-grid">
        <section className="panel summary-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Summary</span>
              <h2>检测摘要区</h2>
            </div>
            <p>指标卡在 B1 先以占位方式稳定布局，后续直接接入真实分析结果。</p>
          </div>
          <div className="summary-grid">
            {summaryCards.map((card) => (
              <article key={card.label} className="summary-card">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.hint}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel upload-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Ingress</span>
              <h2>数据导入区</h2>
            </div>
            <p>保留拖拽与状态提示空间，真实文件解析将在 B2 接入。</p>
          </div>
          <div className="dropzone">
            <div className="dropzone-tag">Excel Template</div>
            <strong>拖拽或选择本地文件</strong>
            <p>支持当前业务模板或近似模板。此处仅为入口与状态骨架，不读取文件内容。</p>
          </div>
          <ul className="queue-list">
            {queueItems.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel rules-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Rule</span>
              <h2>规则说明区</h2>
            </div>
            <p>在视觉上先固定“从三十档到一档”的顺序关系，后续直接映射实际结果。</p>
          </div>
          <div className="rule-chain">
            <span>三十档</span>
            <i />
            <span>二十九档</span>
            <i />
            <span>...</span>
            <i />
            <span>一档</span>
          </div>
          <p className="rule-note">
            若相邻两档出现前值小于后值，则该行记录在 B2/B3 中被标记为违规并进入详情联动。
          </p>
        </section>

        <section className="panel stage-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Pipeline</span>
              <h2>执行进度区</h2>
            </div>
            <p>当前页面明确区分 B1 已完成内容与后续批次待接入内容，避免边界漂移。</p>
          </div>
          <div className="stage-list">
            {stageRows.map((row) => (
              <article key={row.name} className="stage-row">
                <div>
                  <strong>{row.name}</strong>
                  <p>{row.detail}</p>
                </div>
                <span className="status-pill">{row.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel table-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Result Table</span>
              <h2>结果表格区</h2>
            </div>
            <p>先预留筛选、表格和违规色带的布局容器，后续接入真实数据与高亮逻辑。</p>
          </div>
          <div className="table-toolbar">
            <button type="button" className="toolbar-pill toolbar-pill-active">
              全部记录
            </button>
            <button type="button" className="toolbar-pill">
              仅违规
            </button>
            <span className="toolbar-hint">B3 将接入筛选和明细联动</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {tableColumns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {placeholderRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel detail-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Detail</span>
              <h2>违规详情抽屉</h2>
            </div>
            <p>当前只固定信息层次，具体违规对与数值在 B3 接入。</p>
          </div>
          <div className="detail-card">
            <strong>选中记录后显示</strong>
            <p>此区域将展示相邻档位违规对、对应数值和整行状态说明。</p>
            <div className="detail-placeholder">
              <span>三十档</span>
              <span className="detail-separator">→</span>
              <span>一档</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
