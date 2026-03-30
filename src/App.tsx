import type { ChangeEvent, CSSProperties, DragEvent } from 'react'
import { useRef, useState } from 'react'

import {
  parseWorkbookFile,
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

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [analysis, setAnalysis] = useState<TobaccoWorkbookAnalysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sourceFileName, setSourceFileName] = useState('')

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
              : '已识别出至少一行不满足相邻档位单调关系。',
        },
        {
          label: '违规档位对',
          value: String(analysis.summary.invalidPairCount),
          hint: '统计所有相邻档位中前值小于后值的违规对数量。',
        },
        {
          label: '数据源',
          value: analysis.sourceName,
          hint: '浏览器本地解析，无后端参与。',
        },
      ]
    : [
        { label: '总记录数', value: '--', hint: '待导入真实 Excel 模板。' },
        { label: '违规记录数', value: '--', hint: 'B2 将接入单调不增校验。' },
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
        ? '当前页面已持有统一的 rows / violations / rankValues 结构，可供 B3 直接复用。'
        : 'B3 再接筛选、联动与完整高亮表现。',
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
        { title: '空值策略', detail: 'B2 会把档位空值按 0 归一化后再分析。' },
        { title: '当前边界', detail: '只做上传、解析和结构化分析，不提前实现 B3 交互。' },
      ]

  const previewRows = analysis?.rows.slice(0, 8) ?? []
  const focusRow = analysis?.rows.find((row) => !row.isValid) ?? analysis?.rows[0] ?? null

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
            B2 已切入真实 Excel 解析与单调不增校验。当前页面负责上传、模板识别、空值归零和违规对产出，
            B3 再补完整筛选、高亮和详情交互。
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={openFilePicker}>
              导入模板文件
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
              <span>当前批次</span>
              <strong>B2 解析与分析</strong>
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
            <p>摘要卡直接绑定当前分析结果，后续 B3 复用同一数据源做筛选与联动。</p>
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
            <p>当前批次只接最小上传闭环，解析成功后立即生成统一分析结果。</p>
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
            synthetic failing case 都按同一条规则分析。
          </p>
        </section>

        <section className="panel stage-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Pipeline</span>
              <h2>执行进度区</h2>
            </div>
            <p>这里只呈现 B2 的执行状态，不提前挪用 B3 的筛选和交互范围。</p>
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
            <p>当前只展示 B2 必要的结果预览，完整筛选、高亮与选中联动留给 B3。</p>
          </div>
          <div className="table-toolbar">
            <button type="button" className="toolbar-pill toolbar-pill-active">
              结构化结果
            </button>
            <span className="toolbar-hint">
              {analysis
                ? `已解析 ${analysis.summary.totalRows} 条记录，展示前 ${previewRows.length} 条。`
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
                {previewRows.length > 0
                  ? previewRows.map((row) => (
                      <tr key={`${row.productCode}-${row.rowNumber}`}>
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
                    ))
                  : [
                      <tr key="placeholder-0">
                        <td>待导入</td>
                        <td>真实样例解析后显示</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                      </tr>,
                      <tr key="placeholder-1">
                        <td>待导入</td>
                        <td>synthetic failing case 将在测试中验证</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
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
              <h2>分析结果快照</h2>
            </div>
            <p>当前先展示 B2 产出的最小结果快照，不做 B3 的选中联动与详情抽屉交互。</p>
          </div>
          <div className="detail-card">
            {focusRow ? (
              <>
                <strong>
                  {focusRow.productName} / {focusRow.productCode}
                </strong>
                <p>{describeViolations(focusRow)}</p>
                <ul className="detail-list">
                  <li>批发价：{formatNumber(focusRow.wholesalePrice)}</li>
                  <li>投放方式：{focusRow.deliveryMode}</li>
                  <li>合计投放量：{formatNumber(focusRow.totalAllocation)}</li>
                  <li>档位合计：{formatNumber(focusRow.totalRankCount)}</li>
                </ul>
              </>
            ) : (
              <>
                <strong>等待导入后显示</strong>
                <p>上传 Excel 后，此处会展示首条违规记录或首条有效记录的分析快照。</p>
                <div className="detail-placeholder">
                  <span>三十档</span>
                  <span className="detail-separator">→</span>
                  <span>一档</span>
                </div>
              </>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
