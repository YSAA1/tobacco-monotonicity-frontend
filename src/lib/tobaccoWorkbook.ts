import readExcelFile from 'read-excel-file/browser'

const METADATA_HEADERS = [
  '商品编码',
  '商品名称',
  '批发价',
  '投放方式',
  '合计（最终投放量）',
  '合计(档位）',
] as const

export const RANK_HEADERS = [
  '三十档',
  '二十九档',
  '二十八档',
  '二十七档',
  '二十六档',
  '二十五档',
  '二十四档',
  '二十三档',
  '二十二档',
  '二十一档',
  '二十档',
  '十九档',
  '十八档',
  '十七档',
  '十六档',
  '十五档',
  '十四档',
  '十三档',
  '十二档',
  '十一档',
  '十档',
  '九档',
  '八档',
  '七档',
  '六档',
  '五档',
  '四档',
  '三档',
  '二档',
  '一档',
] as const

type WorkbookSheet = {
  sheet: string
  data: unknown[][]
}

export type RankHeader = (typeof RANK_HEADERS)[number]

export type RankViolation = {
  higherRank: RankHeader
  higherValue: number
  lowerRank: RankHeader
  lowerValue: number
}

export type TobaccoAnalysisRow = {
  rowNumber: number
  productCode: string
  productName: string
  wholesalePrice: number
  deliveryMode: string
  totalAllocation: number
  totalRankCount: number
  rankValues: Record<RankHeader, number>
  violations: RankViolation[]
  isValid: boolean
}

export type TobaccoWorkbookAnalysis = {
  sourceName: string
  sheetName: string
  rankHeaders: readonly RankHeader[]
  rows: TobaccoAnalysisRow[]
  summary: {
    totalRows: number
    validRowCount: number
    invalidRowCount: number
    invalidPairCount: number
  }
}

function normalizeText(value: unknown): string {
  return value == null ? '' : String(value).trim()
}

function normalizeNumber(value: unknown): number {
  if (value == null) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const sanitized = normalizeText(value).replaceAll(',', '')
  if (sanitized === '') {
    return 0
  }

  const parsed = Number.parseFloat(sanitized)
  return Number.isFinite(parsed) ? parsed : 0
}

function validateHeaders(headers: string[]): void {
  const expectedHeaders = [...METADATA_HEADERS, ...RANK_HEADERS]

  for (const [index, expectedHeader] of expectedHeaders.entries()) {
    const actualHeader = headers[index]
    if (actualHeader !== expectedHeader) {
      throw new Error(
        `模板表头不匹配：第 ${index + 1} 列期望为“${expectedHeader}”，实际为“${actualHeader || '空'}”。`,
      )
    }
  }
}

function buildRankValues(row: unknown[], rankOffset: number): Record<RankHeader, number> {
  const rankValues = {} as Record<RankHeader, number>

  for (const [index, rankHeader] of RANK_HEADERS.entries()) {
    rankValues[rankHeader] = normalizeNumber(row[rankOffset + index])
  }

  return rankValues
}

function findViolations(rankValues: Record<RankHeader, number>): RankViolation[] {
  const violations: RankViolation[] = []

  for (let index = 0; index < RANK_HEADERS.length - 1; index += 1) {
    const higherRank = RANK_HEADERS[index]
    const lowerRank = RANK_HEADERS[index + 1]
    const higherValue = rankValues[higherRank]
    const lowerValue = rankValues[lowerRank]

    if (higherValue < lowerValue) {
      violations.push({
        higherRank,
        higherValue,
        lowerRank,
        lowerValue,
      })
    }
  }

  return violations
}

function isMeaningfulRow(row: unknown[]): boolean {
  return row.some((cell) => normalizeText(cell) !== '')
}

export function analyzeSheetRows(
  matrix: unknown[][],
  sourceName = 'workbook.xlsx',
  sheetName = 'Sheet1',
): TobaccoWorkbookAnalysis {
  const [headerRow = [], ...dataRows] = matrix
  const headers = headerRow.map((cell) => normalizeText(cell))
  validateHeaders(headers)

  const rankOffset = METADATA_HEADERS.length
  const rows = dataRows.flatMap((row, rowIndex) => {
    if (!isMeaningfulRow(row)) {
      return []
    }

    const rankValues = buildRankValues(row, rankOffset)
    const violations = findViolations(rankValues)

    return [
      {
        rowNumber: rowIndex + 2,
        productCode: normalizeText(row[0]),
        productName: normalizeText(row[1]),
        wholesalePrice: normalizeNumber(row[2]),
        deliveryMode: normalizeText(row[3]),
        totalAllocation: normalizeNumber(row[4]),
        totalRankCount: normalizeNumber(row[5]),
        rankValues,
        violations,
        isValid: violations.length === 0,
      },
    ]
  })

  const invalidRowCount = rows.filter((row) => !row.isValid).length
  const invalidPairCount = rows.reduce((total, row) => total + row.violations.length, 0)

  return {
    sourceName,
    sheetName,
    rankHeaders: RANK_HEADERS,
    rows,
    summary: {
      totalRows: rows.length,
      validRowCount: rows.length - invalidRowCount,
      invalidRowCount,
      invalidPairCount,
    },
  }
}

export function analyzeWorkbookSheets(
  sheets: WorkbookSheet[],
  sourceName = 'workbook.xlsx',
): TobaccoWorkbookAnalysis {
  if (sheets.length !== 1) {
    throw new Error(`当前仅支持单 sheet 模板，实际检测到 ${sheets.length} 个 sheet。`)
  }

  const [sheet] = sheets
  return analyzeSheetRows(sheet.data, sourceName, sheet.sheet)
}

export async function parseWorkbookFile(file: File): Promise<TobaccoWorkbookAnalysis> {
  const sheets = (await readExcelFile(file)) as WorkbookSheet[]
  return analyzeWorkbookSheets(sheets, file.name)
}
