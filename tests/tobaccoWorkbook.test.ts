import path from 'node:path'

import readExcelFile from 'read-excel-file/node'
import { describe, expect, it } from 'vitest'

import {
  analyzeSheetRows,
  analyzeWorkbookSheets,
  RANK_HEADERS,
} from '../src/lib/tobaccoWorkbook'

const realWorkbookPath = path.resolve(process.cwd(), '数据服务_20260329135909181.xlsx')

describe('tobacco workbook parsing', () => {
  it('parses the real workbook into 38 valid structured rows', async () => {
    const sheets = (await readExcelFile(realWorkbookPath)) as Array<{
      sheet: string
      data: unknown[][]
    }>

    const analysis = analyzeWorkbookSheets(sheets, 'real.xlsx')

    expect(analysis.sheetName).toBe('Sheet0')
    expect(analysis.rows).toHaveLength(38)
    expect(analysis.rankHeaders).toEqual(RANK_HEADERS)
    expect(analysis.summary.totalRows).toBe(38)
    expect(analysis.summary.invalidRowCount).toBe(0)
    expect(analysis.summary.validRowCount).toBe(38)
    expect(analysis.rows[0].productCode).toBe('131075')
    expect(analysis.rows[0].rankValues.三十档).toBe(2)
    expect(analysis.rows[0].rankValues.一档).toBe(0)
    expect(analysis.rows.every((row) => row.isValid)).toBe(true)
  })

  it('normalizes blanks to zero and flags synthetic monotonic violations', () => {
    const analysis = analyzeSheetRows(
      [
        [
          '商品编码',
          '商品名称',
          '批发价',
          '投放方式',
          '合计（最终投放量）',
          '合计(档位）',
          ...RANK_HEADERS,
        ],
        [
          'A001',
          '失败样例',
          '100',
          '按档位投放',
          '10',
          '3',
          5,
          '',
          4,
          ...Array.from({ length: RANK_HEADERS.length - 3 }, () => 0),
        ],
        [
          'A002',
          '正常样例',
          '100',
          '按档位投放',
          '10',
          '3',
          4,
          3,
          2,
          ...Array.from({ length: RANK_HEADERS.length - 3 }, () => 0),
        ],
      ],
      'synthetic.xlsx',
      'Sheet0',
    )

    expect(analysis.summary.totalRows).toBe(2)
    expect(analysis.summary.invalidRowCount).toBe(1)
    expect(analysis.summary.invalidPairCount).toBe(1)
    expect(analysis.rows[0].isValid).toBe(false)
    expect(analysis.rows[0].rankValues.二十九档).toBe(0)
    expect(analysis.rows[0].violations).toEqual([
      {
        higherRank: '二十九档',
        higherValue: 0,
        lowerRank: '二十八档',
        lowerValue: 4,
      },
    ])
    expect(analysis.rows[1].isValid).toBe(true)
  })

  it('preserves spreadsheet row numbers when blank spacer rows exist', () => {
    const analysis = analyzeSheetRows(
      [
        [
          '商品编码',
          '商品名称',
          '批发价',
          '投放方式',
          '合计（最终投放量）',
          '合计(档位）',
          ...RANK_HEADERS,
        ],
        [
          'A001',
          '第一行',
          '100',
          '按档位投放',
          '10',
          '3',
          ...Array.from({ length: RANK_HEADERS.length }, () => 0),
        ],
        [],
        [
          'A002',
          '第二行',
          '100',
          '按档位投放',
          '10',
          '3',
          ...Array.from({ length: RANK_HEADERS.length }, () => 0),
        ],
      ],
      'blank-row.xlsx',
      'Sheet0',
    )

    expect(analysis.rows.map((row) => row.rowNumber)).toEqual([2, 4])
  })
})
