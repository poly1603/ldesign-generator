/**
 * 格式化辅助工具
 * 提供各种数据格式化功能
 */

/**
 * 格式化字节大小
 * @param bytes - 字节数
 * @param decimals - 小数位数
 * @returns 格式化后的字符串
 * @example
 * formatBytes(1024) // '1.00 KB'
 * formatBytes(1048576) // '1.00 MB'
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  if (!bytes) return 'N/A'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * 格式化时长（毫秒）
 * @param ms - 毫秒数
 * @param format - 格式类型
 * @returns 格式化后的字符串
 * @example
 * formatDuration(1500) // '1.50s'
 * formatDuration(65000) // '1.08min'
 */
export function formatDuration(ms: number, format: 'short' | 'long' = 'short'): string {
  if (!ms || ms < 0) return '0ms'
  
  if (format === 'long') {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = ms % 1000
    
    const parts: string[] = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0) parts.push(`${seconds}s`)
    if (milliseconds > 0 && parts.length === 0) parts.push(`${milliseconds}ms`)
    
    return parts.join(' ') || '0ms'
  }
  
  // Short format
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  } else if (ms < 3600000) {
    return `${(ms / 60000).toFixed(2)}min`
  } else {
    return `${(ms / 3600000).toFixed(2)}h`
  }
}

/**
 * 格式化日期
 * @param date - 日期对象或时间戳
 * @param format - 格式字符串
 * @returns 格式化后的日期字符串
 * @example
 * formatDate(new Date(), 'YYYY-MM-DD') // '2024-01-01'
 * formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') // '2024-01-01 12:30:45'
 */
export function formatDate(date: Date | number | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = date instanceof Date ? date : new Date(date)
  
  if (isNaN(d.getTime())) return 'Invalid Date'
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  const milliseconds = String(d.getMilliseconds()).padStart(3, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
    .replace('SSS', milliseconds)
}

/**
 * 格式化相对时间
 * @param date - 日期对象或时间戳
 * @returns 相对时间字符串
 * @example
 * formatRelativeTime(Date.now() - 60000) // '1 minute ago'
 */
export function formatRelativeTime(date: Date | number | string): string {
  const d = date instanceof Date ? date : new Date(date)
  const now = Date.now()
  const diff = now - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  
  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${years} year${years > 1 ? 's' : ''} ago`
}

/**
 * 格式化数字
 * @param num - 数字
 * @param options - 格式化选项
 * @returns 格式化后的字符串
 */
export function formatNumber(
  num: number,
  options?: {
    decimals?: number
    thousandsSeparator?: string
    decimalSeparator?: string
    prefix?: string
    suffix?: string
  }
): string {
  const {
    decimals = 0,
    thousandsSeparator = ',',
    decimalSeparator = '.',
    prefix = '',
    suffix = ''
  } = options || {}
  
  const parts = num.toFixed(decimals).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)
  
  return prefix + parts.join(decimalSeparator) + suffix
}

/**
 * 格式化百分比
 * @param value - 值（0-1 或 0-100）
 * @param decimals - 小数位数
 * @param range - 值的范围
 * @returns 格式化后的百分比字符串
 */
export function formatPercentage(
  value: number,
  decimals = 2,
  range: '0-1' | '0-100' = '0-1'
): string {
  const percentage = range === '0-1' ? value * 100 : value
  return `${percentage.toFixed(decimals)}%`
}

/**
 * 格式化货币
 * @param amount - 金额
 * @param currency - 货币符号
 * @param decimals - 小数位数
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(amount: number, currency = '$', decimals = 2): string {
  return formatNumber(amount, {
    decimals,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    prefix: currency
  })
}

/**
 * 格式化文件路径（显示）
 * @param filePath - 文件路径
 * @param maxLength - 最大长度
 * @returns 格式化后的路径
 */
export function formatFilePath(filePath: string, maxLength = 50): string {
  if (!filePath || filePath.length <= maxLength) return filePath
  
  const parts = filePath.split(/[/\\]/)
  if (parts.length <= 2) {
    // 简单截断
    return '...' + filePath.slice(-(maxLength - 3))
  }
  
  // 保留首尾，中间用 ... 代替
  const fileName = parts[parts.length - 1]
  const dirName = parts[0]
  
  if (fileName.length + dirName.length + 6 >= maxLength) {
    return dirName + '/.../' + fileName
  }
  
  return filePath
}

/**
 * 格式化列表
 * @param items - 项目数组
 * @param options - 格式化选项
 * @returns 格式化后的列表字符串
 */
export function formatList(
  items: string[],
  options?: {
    separator?: string
    lastSeparator?: string
    maxItems?: number
    moreText?: string
  }
): string {
  const {
    separator = ', ',
    lastSeparator = ' and ',
    maxItems,
    moreText = 'more'
  } = options || {}
  
  if (!items || items.length === 0) return ''
  
  let displayItems = items
  let hasMore = false
  
  if (maxItems && items.length > maxItems) {
    displayItems = items.slice(0, maxItems)
    hasMore = true
  }
  
  if (displayItems.length === 1) {
    return displayItems[0] + (hasMore ? ` ${lastSeparator}${items.length - maxItems!} ${moreText}` : '')
  }
  
  const allButLast = displayItems.slice(0, -1).join(separator)
  const last = displayItems[displayItems.length - 1]
  const moreInfo = hasMore ? ` ${lastSeparator}${items.length - maxItems!} ${moreText}` : ''
  
  return allButLast + lastSeparator + last + moreInfo
}

/**
 * 格式化键值对
 * @param obj - 对象
 * @param indent - 缩进
 * @returns 格式化后的字符串
 */
export function formatKeyValue(obj: Record<string, any>, indent = '  '): string {
  const lines: string[] = []
  
  for (const [key, value] of Object.entries(obj)) {
    let formattedValue: string
    
    if (typeof value === 'object' && value !== null) {
      formattedValue = JSON.stringify(value)
    } else {
      formattedValue = String(value)
    }
    
    lines.push(`${indent}${key}: ${formattedValue}`)
  }
  
  return lines.join('\n')
}

/**
 * 格式化表格（简单版）
 * @param data - 表格数据
 * @param headers - 表头
 * @returns 格式化后的表格字符串
 */
export function formatTable(data: any[][], headers?: string[]): string {
  if (!data || data.length === 0) return ''
  
  // 计算每列的最大宽度
  const columnWidths: number[] = []
  const allRows = headers ? [headers, ...data] : data
  
  allRows.forEach(row => {
    row.forEach((cell, i) => {
      const cellStr = String(cell)
      columnWidths[i] = Math.max(columnWidths[i] || 0, cellStr.length)
    })
  })
  
  // 生成表格
  const lines: string[] = []
  
  if (headers) {
    const headerLine = headers
      .map((h, i) => String(h).padEnd(columnWidths[i]))
      .join(' │ ')
    lines.push(headerLine)
    lines.push(columnWidths.map(w => '─'.repeat(w)).join('─┼─'))
  }
  
  data.forEach(row => {
    const rowLine = row
      .map((cell, i) => String(cell).padEnd(columnWidths[i]))
      .join(' │ ')
    lines.push(rowLine)
  })
  
  return lines.join('\n')
}

/**
 * 创建进度条
 * @param value - 当前值
 * @param max - 最大值
 * @param width - 宽度
 * @param options - 选项
 * @returns 进度条字符串
 */
export function createProgressBar(
  value: number,
  max: number,
  width = 20,
  options?: {
    filled?: string
    empty?: string
    showPercentage?: boolean
  }
): string {
  const {
    filled = '█',
    empty = '░',
    showPercentage = true
  } = options || {}
  
  const percentage = max > 0 ? value / max : 0
  const filledCount = Math.round(percentage * width)
  const emptyCount = width - filledCount
  
  const bar = filled.repeat(filledCount) + empty.repeat(emptyCount)
  
  if (showPercentage) {
    return `${bar} ${(percentage * 100).toFixed(1)}%`
  }
  
  return bar
}

/**
 * 格式化代码行数
 * @param lineNumber - 行号
 * @param maxLines - 最大行数
 * @returns 格式化后的行号
 */
export function formatLineNumber(lineNumber: number, maxLines: number): string {
  const width = String(maxLines).length
  return String(lineNumber).padStart(width, ' ')
}


