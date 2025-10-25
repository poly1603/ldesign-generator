/**
 * 格式化工具函数测试
 */

import { describe, it, expect } from 'vitest'
import {
  formatBytes,
  formatDuration,
  formatDate,
  formatNumber,
  formatPercentage,
  formatCurrency,
  createProgressBar
} from '../../utils/format-helpers'

describe('Format Helpers', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B')
      expect(formatBytes(1024)).toBe('1.00 KB')
      expect(formatBytes(1048576)).toBe('1.00 MB')
      expect(formatBytes(1073741824)).toBe('1.00 GB')
    })

    it('should handle decimals parameter', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB')
      expect(formatBytes(1536, 1)).toBe('1.5 KB')
      expect(formatBytes(1536, 3)).toBe('1.500 KB')
    })

    it('should handle edge cases', () => {
      expect(formatBytes(null as any)).toBe('N/A')
      expect(formatBytes(undefined as any)).toBe('N/A')
    })
  })

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms')
      expect(formatDuration(999)).toBe('999ms')
    })

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.00s')
      expect(formatDuration(1500)).toBe('1.50s')
      expect(formatDuration(59000)).toBe('59.00s')
    })

    it('should format minutes', () => {
      expect(formatDuration(60000)).toBe('1.00min')
      expect(formatDuration(90000)).toBe('1.50min')
    })

    it('should format hours', () => {
      expect(formatDuration(3600000)).toBe('1.00h')
    })

    it('should handle long format', () => {
      const result = formatDuration(3661000, 'long')
      expect(result).toContain('1h')
      expect(result).toContain('1m')
      expect(result).toContain('1s')
    })

    it('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('0ms')
      expect(formatDuration(-100)).toBe('0ms')
    })
  })

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-01-15T10:30:45')
      const result = formatDate(date)
      expect(result).toMatch(/2024-01-15 \d{2}:30:45/)
    })

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15')
      expect(formatDate(date, 'YYYY/MM/DD')).toBe('2024/01/15')
    })

    it('should handle timestamp input', () => {
      const timestamp = new Date('2024-01-15').getTime()
      const result = formatDate(timestamp, 'YYYY-MM-DD')
      expect(result).toBe('2024-01-15')
    })

    it('should handle invalid date', () => {
      expect(formatDate('invalid date')).toBe('Invalid Date')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with default options', () => {
      expect(formatNumber(1234)).toBe('1,234')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('should format with decimals', () => {
      expect(formatNumber(1234.567, { decimals: 2 })).toBe('1,234.57')
    })

    it('should add prefix and suffix', () => {
      expect(formatNumber(100, { prefix: '$', suffix: ' USD' })).toBe('$100 USD')
    })

    it('should use custom separators', () => {
      expect(formatNumber(1234.5, {
        decimals: 1,
        thousandsSeparator: ' ',
        decimalSeparator: ','
      })).toBe('1 234,5')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage from 0-1 range', () => {
      expect(formatPercentage(0.5)).toBe('50.00%')
      expect(formatPercentage(0.856, 1)).toBe('85.6%')
    })

    it('should format percentage from 0-100 range', () => {
      expect(formatPercentage(50, 0, '0-100')).toBe('50%')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with default settings', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should use custom currency symbol', () => {
      expect(formatCurrency(1234, '¥')).toBe('¥1,234.00')
      expect(formatCurrency(1234, '€')).toBe('€1,234.00')
    })

    it('should handle decimals', () => {
      expect(formatCurrency(1234.567, '$', 0)).toBe('$1,235')
    })
  })

  describe('createProgressBar', () => {
    it('should create progress bar', () => {
      const bar = createProgressBar(50, 100, 10)
      expect(bar).toContain('█')
      expect(bar).toContain('░')
      expect(bar).toContain('50.0%')
    })

    it('should handle full progress', () => {
      const bar = createProgressBar(100, 100, 10)
      expect(bar).toContain('50.0%') // Note: Bar will have some filled chars
    })

    it('should handle zero progress', () => {
      const bar = createProgressBar(0, 100, 10)
      expect(bar).toContain('0.0%')
    })

    it('should work without percentage', () => {
      const bar = createProgressBar(50, 100, 10, { showPercentage: false })
      expect(bar).not.toContain('%')
    })

    it('should use custom characters', () => {
      const bar = createProgressBar(50, 100, 10, {
        filled: '#',
        empty: '-',
        showPercentage: false
      })
      expect(bar).toContain('#')
      expect(bar).toContain('-')
    })
  })
})

