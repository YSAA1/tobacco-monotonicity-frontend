import type { ChangeEvent, CSSProperties, DragEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import {
  analyzeSheetRows,
  parseWorkbookFile,
  RANK_HEADERS,
  type TobaccoAnalysisRow,
  type TobaccoWorkbookAnalysis,
} from './lib/tobaccoWorkbook'

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

type FilterMode = 'all' | 'invalid' | 'valid'

type InsightMetric = {
  label: string
  value: number
  max: number
  tone: 'gold' | 'red' | 'green'
}

const previewColumns = ['商品编码', '商品名称', '批发价', '状态', '违规对', '三十档', '一档']

const heroGlowStyle: CSSProperties = {
  background:
    'radial-gradient(circle at top, rgba(220, 168, 92, 0.35), rgba(7, 24, 22, 0) 58%)',
}

const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
})

function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

function describeViolations(row: TobaccoAnalysisRow): string {
  if (row.violations.length === 0) {
    return '未发现相邻档位逆增。'
  }

  return row.violations
    .map(
      (violation) =>
        `${violation.higherRank} ${formatNumber(violation.higherValue)} < ${violation.lowerRank} ${formatNumber(violation.lowerValue)}`,
    )
    .join('；')
}

function rowKey(row: TobaccoAnalysisRow): string {
  return `${row.productCode}-${row.rowNumber}`
}

function buildRankHotspots(rows: TobaccoAnalysisRow[]): Array<{ rankPair: string; count: number }> {
  const counter = new Map<string, number>()

  for (const row of rows) {
    for (const violation of row.violations) {
      const pair = `${violation.higherRank} → ${violation.lowerRank}`
      counter.set(pair, (counter.get(pair) ?? 0) + 1)
    }
  }

  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([rankPair, count]) => ({ rankPair, count }))
}

function buildSyntheticFailingAnalysis(): TobaccoWorkbookAnalysis {
  const baseHeader = [
    '商品编码',
    '商品名称',
    '批发价',
    '投放方式',
    '合计（最终投放量）',
    '合计(档位）',
    ...RANK_HEADERS,
  ]

  const syntheticMatrix: unknown[][] = [
    baseHeader,
    [
      'S001',
      '合成违规样例',
      '260',
      '按档位投放',
      '120',
      '12',
      10,
      4,
      7,
      ...Array.from({ length: RANK_HEADERS.length - 3 }, () => 0),
    ],
    [
      'S002',
      '合成正常样例',
      '180',
      '按档位投放',
      '80',
      '8',
      6,
      5,
      4,
      ...Array.from({ length: RANK_HEADERS.length - 3 }, () => 0),
    ],
  ]

  return analyzeSheetRows(syntheticMatrix, 'synthetic-failing-case.xlsx', 'SyntheticCase')
}

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [analysis, setAnalysis] = useState<TobaccoWorkbookAnalysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sourceFileName, setSourceFileName] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null)

  const allRows = analysis?.rows ?? []
  const filteredRows = allRows.filter((row) => {
    if (filterMode === 'invalid') {
      return !row.isValid
    }
    if (filterMode === 'valid') {
      return row.isValid
    }
    return true
  })
  const maxPairsPerRow = allRows.reduce((max, row) => Math.max(max, row.violations.length), 0)
  const rankHotspots = buildRankHotspots(allRows)
  const insightMetrics: InsightMetric[] = analysis
    ? [
        {
          label: '通过率',
          value: analysis.summary.validRowCount,
          max: Math.max(analysis.summary.totalRows, 1),
          tone: 'green',
        },
        {
          label: '违规行',
          value: analysis.summary.invalidRowCount,
          max: Math.max(analysis.summary.totalRows, 1),
          tone: 'red',
        },
        {
          label: '违规对',
          value: analysis.summary.invalidPairCount,
          max: Math.max(maxPairsPerRow * Math.max(analysis.summary.totalRows, 1), 1),
          tone: 'gold',
        },
      ]
    : []

  useEffect(() => {
    if (filteredRows.length === 0) {
      if (selectedRowKey !== null) {
        setSelectedRowKey(null)
      }
      return
    }

    const hasSelected = selectedRowKey
      ? filteredRows.some((row) => rowKey(row) === selectedRowKey)
      : false

    if (!hasSelected) {
      const fallback = filteredRows.find((row) => !row.isValid) ?? filteredRows[0]
      setSelectedRowKey(rowKey(fallback))
    }
  }, [filteredRows, selectedRowKey])

  const summaryCards: SummaryCard[] = analysis
    ? [
        {
          label: '总记录数',
          value: String(analysis.summary.totalRows),
          hint: `来自 ${analysis.sheetName}，已完成模板识别与行级解析。`,
        },
        {
          label: '违规记录数',
          value: String(analysis.summary.invalidRowCount),
          hint:
            analysis.summary.invalidRowCount === 0
              ? '当前真实样例全部满足单调不增。'
              : `已识别出 ${analysis.summary.invalidRowCount} 行不满足相邻档位单调关系。`,
        },
        {
          label: '违规档位对',
          value: String(analysis.summary.invalidPairCount),
          hint: '统计所有相邻档位中前值小于后值的违规对数量。',
        },
        {
          label: '数据源',
          value: analysis.sourceName,
          hint: `当前筛选：${filterMode === 'all' ? '全部记录' : filterMode === 'invalid' ? '仅违规' : '仅通过'}。`,
        },
      ]
    : [
        { label: '总记录数', value: '--', hint: '待导入真实 Excel 模板。' },
        { label: '违规记录数', value: '--', hint: '导入后自动执行单调不增校验。' },
        { label: '违规档位对', value: '--', hint: '当前尚未产出结构化违规对。' },
        { label: '数据源', value: '本地上传', hint: '首版不依赖后端服务。' },
      ]

  const stageRows: StageRow[] = [
    {
      name: '模板导入',
      status: isLoading ? '解析中' : errorMessage ? '失败' : analysis ? '已完成' : '待接入',
      detail: isLoading
        ? '正在读取本地工作簿并校验模板头部。'
        : errorMessage
          ? errorMessage
          : analysis
            ? `已识别 ${analysis.sheetName}，共 ${analysis.summary.totalRows} 行数据。`
            : '等待上传当前业务模板或近似模板。',
    },
    {
      name: '规则分析',
      status: analysis
        ? analysis.summary.invalidRowCount === 0
          ? '全部通过'
          : `发现 ${analysis.summary.invalidRowCount} 条违规`
        : '待接入',
      detail: analysis
        ? `空值已按 0 归一化，累计识别 ${analysis.summary.invalidPairCount} 个相邻档位违规对。`
        : '规则为三十档 >= 二十九档 >= ... >= 一档。',
    },
    {
      name: '结果数据源',
      status: analysis ? '已产出' : '骨架就绪',
      detail: analysis
        ? '筛选、高亮与详情均复用 rows / violations / rankValues，不新增第二套规则。'
        : '导入后将启用筛选、联动与高亮展示。',
    },
  ]

  const queueItems: QueueItem[] = analysis
    ? [
        { title: '当前文件', detail: `${analysis.sourceName} / ${analysis.sheetName}` },
        {
          title: '模板要求',
          detail: '单 sheet、6 个元数据列、30 个档位列，按当前业务模板精确识别。',
        },
        { title: '空值策略', detail: '档位空值按 0 处理，再参与单调不增判断。' },
      ]
    : [
      { title: '模板要求', detail: '单 sheet、6 个元数据列、30 个档位列。' },
      { title: '空值策略', detail: '档位空值按 0 归一化后再分析。' },
      { title: '当前能力', detail: '使用同一分析数据源完成筛选、高亮和详情交互。' },
    ]

  const selectedRow =
    filteredRows.find((row) => rowKey(row) === selectedRowKey) ??
    filteredRows.find((row) => !row.isValid) ??
    filteredRows[0] ??
    null

  async function handleFile(file: File | null): Promise<void> {
    if (!file) {
      return
    }

    setSourceFileName(file.name)
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const nextAnalysis = await parseWorkbookFile(file)
      setAnalysis(nextAnalysis)
      setFilterMode(nextAnalysis.summary.invalidRowCount > 0 ? 'invalid' : 'all')
    } catch (error) {
      setAnalysis(null)
      setErrorMessage(error instanceof Error ? error.message : '文件解析失败，请检查模板格式。')
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null
    void handleFile(file)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0] ?? null
    void handleFile(file)
  }

  function openFilePicker(): void {
    fileInputRef.current?.click()
  }

  function loadSyntheticCase(): void {
    const syntheticAnalysis = buildSyntheticFailingAnalysis()
    setAnalysis(syntheticAnalysis)
    setErrorMessage(null)
    setSourceFileName(syntheticAnalysis.sourceName)
    setFilterMode('invalid')
  }

  function scrollToRuleSection(): void {
    document.getElementById('rule-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
            导入模板后可自动完成单调性分析，并通过筛选、行高亮和详情联动快速定位问题记录。
            分析链路保持单一数据源，支持违规示例数据快速验证。
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={openFilePicker}>
              导入模板文件
            </button>
            <button type="button" className="secondary-button" onClick={loadSyntheticCase}>
              加载违规示例数据
            </button>
            <button type="button" className="secondary-button" onClick={scrollToRuleSection}>
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
              <span>状态</span>
              <strong>就绪</strong>
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
            <p>摘要卡与洞察条形图共同展示关键结果，所有值均来自同一分析结果对象。</p>
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

        <section className="panel insight-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Insight</span>
              <h2>违规热区与质量刻度</h2>
            </div>
            <p>轻量图表只表达关键结论，不替代明细表与规则说明。</p>
          </div>
          {analysis ? (
            <div className="insight-layout">
              <div className="insight-metric-list">
                {insightMetrics.map((metric) => {
                  const percent = Math.round((metric.value / metric.max) * 100)
                  return (
                    <article key={metric.label} className="insight-metric">
                      <div className="insight-head">
                        <strong>{metric.label}</strong>
                        <span>
                          {metric.value} / {metric.max}
                        </span>
                      </div>
                      <div className="insight-track">
                        <span
                          className={`insight-fill insight-fill-${metric.tone}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className="hotspot-list">
                <h3>高频违规档位对</h3>
                {rankHotspots.length > 0 ? (
                  <ul>
                    {rankHotspots.map((item) => (
                      <li key={item.rankPair}>
                        <span>{item.rankPair}</span>
                        <strong>{item.count} 次</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>当前文件暂无违规档位对，整体单调性通过。</p>
                )}
              </div>
            </div>
          ) : (
            <p className="insight-placeholder">上传文件后展示违规热区与质量刻度。</p>
          )}
        </section>

        <section className="panel upload-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Ingress</span>
              <h2>数据导入区</h2>
            </div>
            <p>导入成功后立即进入统一分析结果，供筛选区、表格和详情区同步联动。</p>
          </div>
          <div
            className={`dropzone ${errorMessage ? 'dropzone-error' : ''}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="dropzone-tag">Excel Template</div>
            <strong>{isLoading ? '正在解析文件...' : '拖拽或选择本地文件'}</strong>
            <p>
              {errorMessage
                ? errorMessage
                : analysis
                  ? `已完成 ${analysis.sourceName} 解析，当前共得到 ${analysis.summary.totalRows} 条结构化记录。`
                  : '支持当前业务模板或近似模板，上传后会立即校验表头并执行单调性分析。'}
            </p>
            <div className="dropzone-actions">
              <button type="button" className="primary-button" onClick={openFilePicker}>
                选择 Excel 文件
              </button>
              <button type="button" className="secondary-button" onClick={loadSyntheticCase}>
                加载违规示例
              </button>
              <span className="dropzone-file">{sourceFileName || '尚未选择文件'}</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="file-input"
              onChange={handleInputChange}
            />
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

        <section className="panel rules-panel" id="rule-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Rule</span>
              <h2>规则说明区</h2>
            </div>
            <p>本批次已经把规则固化为真实计算逻辑，而不是页面占位文案。</p>
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
            任意相邻两档只要出现前值小于后值，即记为违规。档位空值按 0 归一化后参与判断，真实样例与
            违规示例数据与真实模板都按同一条规则分析。
          </p>
        </section>

        <section className="panel stage-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Pipeline</span>
              <h2>执行进度区</h2>
            </div>
            <p>展示导入、分析、筛选、详情联动的完整流程状态。</p>
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
              <h2>结构化结果预览</h2>
            </div>
            <p>结果表用于定位具体记录，和上方刻度图共享同一分析数据源。</p>
          </div>
          <div className="table-toolbar">
            <button
              type="button"
              className={`toolbar-pill ${filterMode === 'all' ? 'toolbar-pill-active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              全部（{analysis ? analysis.summary.totalRows : 0}）
            </button>
            <button
              type="button"
              className={`toolbar-pill ${filterMode === 'invalid' ? 'toolbar-pill-active' : ''}`}
              onClick={() => setFilterMode('invalid')}
            >
              仅违规（{analysis ? analysis.summary.invalidRowCount : 0}）
            </button>
            <button
              type="button"
              className={`toolbar-pill ${filterMode === 'valid' ? 'toolbar-pill-active' : ''}`}
              onClick={() => setFilterMode('valid')}
            >
              仅通过（{analysis ? analysis.summary.validRowCount : 0}）
            </button>
            <span className="toolbar-hint">
              {analysis
                ? `当前展示 ${filteredRows.length} 条记录，点击任意行可查看详细违规档位对。`
                : '上传后展示解析结果预览。'}
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {previewColumns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0
                  ? filteredRows.map((row) => {
                      const key = rowKey(row)
                      const selected = selectedRow ? rowKey(selectedRow) === key : false

                      return (
                        <tr
                          key={key}
                          className={`${!row.isValid ? 'table-row-invalid' : ''} ${selected ? 'table-row-selected' : ''}`}
                          onClick={() => setSelectedRowKey(key)}
                        >
                        <td>{row.productCode}</td>
                        <td>{row.productName}</td>
                        <td>{formatNumber(row.wholesalePrice)}</td>
                        <td>
                          <span
                            className={`table-status ${row.isValid ? 'table-status-valid' : 'table-status-invalid'}`}
                          >
                            {row.isValid ? '通过' : '违规'}
                          </span>
                        </td>
                        <td>{row.violations.length}</td>
                        <td>{formatNumber(row.rankValues.三十档)}</td>
                        <td>{formatNumber(row.rankValues.一档)}</td>
                        </tr>
                      )
                    })
                  : [
                      <tr key="placeholder-0" className="table-empty">
                        <td colSpan={7}>
                          {analysis ? '当前筛选下无记录。请切换筛选模式。' : '待导入：真实样例解析后显示。'}
                        </td>
                      </tr>,
                    ]}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel detail-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Detail</span>
              <h2>违规详情联动</h2>
            </div>
            <p>详情面板与结果表保持单一数据源联动，点击行后即时展示违规对与元数据。</p>
          </div>
          <div className="detail-card">
            {selectedRow ? (
              <>
                <strong>
                  {selectedRow.productName} / {selectedRow.productCode}
                </strong>
                <p>{describeViolations(selectedRow)}</p>
                <ul className="detail-list">
                  <li>行号：{selectedRow.rowNumber}</li>
                  <li>批发价：{formatNumber(selectedRow.wholesalePrice)}</li>
                  <li>投放方式：{selectedRow.deliveryMode}</li>
                  <li>合计投放量：{formatNumber(selectedRow.totalAllocation)}</li>
                  <li>档位合计：{formatNumber(selectedRow.totalRankCount)}</li>
                </ul>
                {selectedRow.violations.length > 0 ? (
                  <ul className="violation-list">
                    {selectedRow.violations.map((violation) => (
                      <li key={`${violation.higherRank}-${violation.lowerRank}`}>
                        {violation.higherRank} {formatNumber(violation.higherValue)} {'<'} {violation.lowerRank}{' '}
                        {formatNumber(violation.lowerValue)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="detail-safe">当前记录无违规档位对。</p>
                )}
              </>
            ) : (
              <>
                <strong>等待导入后显示</strong>
                <p>上传 Excel 或加载违规示例数据后，点击表格行可查看详细分析。</p>
                <div className="detail-placeholder">
                  <span>三十档</span>
                  <span className="detail-separator">→</span>
                  <span>一档</span>
                </div>
              </>
            )}
          </div>
        </aside>

        <section className="panel release-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Release</span>
              <h2>使用检查清单</h2>
            </div>
            <p>用于快速复核主流程与样例复现，不引入额外业务功能。</p>
          </div>
          <ol className="release-list">
            <li>点击“加载违规示例数据”，确认表格出现违规高亮行。</li>
            <li>切换“仅违规/仅通过”筛选，核对记录数和详情面板同步变化。</li>
            <li>导入真实模板文件，确认可完成全链路解析且无前端错误。</li>
          </ol>
        </section>
      </main>
    </div>
  )
}

export default App
